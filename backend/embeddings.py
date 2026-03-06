"""
Pure-Python vector store using numpy cosine similarity + pickle persistence.
Replaces ChromaDB — works on Python 3.14 with zero native deps.
"""

import os
import pickle
import numpy as np
from pathlib import Path

STORE_PATH = Path("./vector_store.pkl")


class VectorStore:
    def __init__(self):
        self.documents: list[str] = []
        self.embeddings: list[list[float]] = []
        self.metadatas: list[dict] = []
        self.ids: list[str] = []

    def save(self):
        with open(STORE_PATH, "wb") as f:
            pickle.dump({
                "documents": self.documents,
                "embeddings": self.embeddings,
                "metadatas": self.metadatas,
                "ids": self.ids,
            }, f, protocol=pickle.HIGHEST_PROTOCOL)

    def load(self):
        if STORE_PATH.exists():
            with open(STORE_PATH, "rb") as f:
                data = pickle.load(f)
            self.documents = data["documents"]
            self.embeddings = data["embeddings"]
            self.metadatas = data["metadatas"]
            self.ids = data["ids"]

    def upsert(self, documents: list[str], embeddings: list[list[float]],
               metadatas: list[dict], ids: list[str]):
        id_idx = {id_: i for i, id_ in enumerate(self.ids)}
        for doc, emb, meta, id_ in zip(documents, embeddings, metadatas, ids):
            if id_ in id_idx:
                i = id_idx[id_]
                self.documents[i] = doc
                self.embeddings[i] = emb
                self.metadatas[i] = meta
            else:
                self.ids.append(id_)
                self.documents.append(doc)
                self.embeddings.append(emb)
                self.metadatas.append(meta)
        self.save()

    def query(self, query_embedding: list[float], n_results: int = 5):
        if not self.embeddings:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

        q = np.array(query_embedding, dtype=np.float32)
        q_norm = q / (np.linalg.norm(q) + 1e-10)

        mat = np.array(self.embeddings, dtype=np.float32)
        norms = np.linalg.norm(mat, axis=1, keepdims=True) + 1e-10
        mat_norm = mat / norms

        # Cosine similarity → distance = 1 - similarity
        similarities = mat_norm @ q_norm
        distances = (1.0 - similarities).tolist()

        k = min(n_results, len(distances))
        top_idx = sorted(range(len(distances)), key=lambda i: distances[i])[:k]

        return {
            "documents": [[self.documents[i] for i in top_idx]],
            "metadatas": [[self.metadatas[i] for i in top_idx]],
            "distances": [[distances[i] for i in top_idx]],
        }

    def count(self) -> int:
        return len(self.documents)


# ── Singleton ────────────────────────────────────────────────────
_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
        _store.load()
    return _store


def refresh_collection() -> VectorStore:
    """Force reload from disk (called after admin adds a new answer)."""
    global _store
    _store = VectorStore()
    _store.load()
    return _store


def collection_size() -> int:
    return get_vector_store().count()
