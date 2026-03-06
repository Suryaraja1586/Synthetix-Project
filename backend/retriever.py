"""
Top-k semantic retrieval using the pure-Python VectorStore.
Fixed escalation logic with a higher threshold + score-gap guard.
"""

import os
from sentence_transformers import SentenceTransformer
from embeddings import get_vector_store

_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


# ── Tunable thresholds ────────────────────────────────────────────
# The primary confidence threshold. A best-score below this → escalate.
# all-MiniLM-L6-v2 on a typical support KB:
#   - Clearly relevant queries:  0.70 – 0.95
#   - Vaguely related queries:   0.50 – 0.70
#   - Unrelated queries:         0.30 – 0.52
# Setting to 0.62 gives a safe margin that only resolves clearly relevant.
THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.62"))

# Minimum gap between the best and second-best score.
# If results all cluster near the same score, the KB has no clear match.
MIN_SCORE_GAP = float(os.getenv("MIN_SCORE_GAP", "0.02"))


def retrieve(query: str, top_k: int = 5) -> tuple:
    """
    Returns:
        docs       - list of matched document strings
        sources    - list of source metadata strings
        scores     - list of similarity scores (0–1), best first
        best_score - highest similarity score
        confident  - True only if:
                       (a) best_score >= THRESHOLD, AND
                       (b) the store has enough data to be reliable
    """
    store = get_vector_store()

    if store.count() == 0:
        return [], [], [], 0.0, False

    # Need at least a few KB entries for meaningful retrieval
    if store.count() < 5:
        return [], [], [], 0.0, False

    model = get_model()
    query_emb = model.encode([query]).tolist()[0]

    n = min(top_k, store.count())
    results = store.query(query_emb, n_results=n)

    docs, sources, scores = [], [], []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        # distance = 1 - cosine_sim → similarity = 1 - distance
        similarity = round(1.0 - float(dist), 4)
        docs.append(doc)
        sources.append(meta.get("source", "knowledge_base"))
        scores.append(max(0.0, similarity))

    if not scores:
        return [], [], [], 0.0, False

    best_score = max(scores)

    # ── Confidence decision ───────────────────────────────────────
    # Must clear the primary threshold
    if best_score < THRESHOLD:
        return docs, sources, scores, best_score, False

    # If there are 2+ results, the best must be meaningfully better
    # than the second-best (guards against ambiguous retrieval)
    if len(scores) >= 2:
        sorted_scores = sorted(scores, reverse=True)
        gap = sorted_scores[0] - sorted_scores[1]
        if gap < MIN_SCORE_GAP:
            # Scores are packed together — KB has no clear winner
            return docs, sources, scores, best_score, False

    return docs, sources, scores, best_score, True
