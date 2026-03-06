"""
Top-k semantic retrieval using the pure-Python VectorStore.
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


THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.45"))


def retrieve(query: str, top_k: int = 5) -> tuple:
    """
    Returns:
        docs       - list of matched document strings
        sources    - list of source metadata strings
        scores     - list of similarity scores (0–1)
        best_score - highest similarity score
        confident  - True if best_score >= THRESHOLD
    """
    store = get_vector_store()

    if store.count() == 0:
        return [], [], [], 0.0, False

    model = get_model()
    query_emb = model.encode([query]).tolist()[0]

    results = store.query(query_emb, n_results=min(top_k, store.count()))

    docs, sources, scores = [], [], []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        # distance = 1 - cosine_sim  →  similarity = 1 - distance
        similarity = round(1.0 - dist, 4)
        docs.append(doc)
        sources.append(meta.get("source", "knowledge_base"))
        scores.append(max(0.0, similarity))

    best_score = max(scores) if scores else 0.0
    confident = best_score >= THRESHOLD

    return docs, sources, scores, best_score, confident
