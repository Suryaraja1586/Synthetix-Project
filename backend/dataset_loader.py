"""
Ingests the HuggingFace 'Tobi-Bueck/customer-support-tickets' dataset
into the pure-Python VectorStore.

Run this ONCE before starting the server:
    python dataset_loader.py
"""

import time
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from embeddings import get_vector_store

BATCH_SIZE = 200


def ingest_hf_dataset():
    print("📥 Loading HuggingFace dataset: Tobi-Bueck/customer-support-tickets ...")
    ds = load_dataset("Tobi-Bueck/customer-support-tickets")

    split_name = "train" if "train" in ds else list(ds.keys())[0]
    data = ds[split_name]
    print(f"✅ Loaded {len(data)} rows from split '{split_name}'")

    model = SentenceTransformer("all-MiniLM-L6-v2")
    store = get_vector_store()

    if store.count() > 0:
        print(f"⚠️  Vector store already has {store.count()} entries. Skipping re-ingestion.")
        print("   Delete vector_store.pkl to re-ingest from scratch.")
        return

    texts, metadatas, ids = [], [], []

    for i, row in enumerate(data):
        subject = str(row.get("subject", "") or "")
        body = str(row.get("body", "") or "")
        answer = str(row.get("answer", "") or "")
        ticket_type = str(row.get("queue","") or "Other")

        chunk = f"Subject: {subject}\nTicket: {body}\n\nResolution: {answer}".strip()
        if not chunk or chunk == "Subject: \nTicket: \n\nResolution:":
            continue

        texts.append(chunk)
        metadatas.append({"source": f"hf_dataset_row_{i}", "category": ticket_type})
        ids.append(f"ds_{i}")

        if len(texts) >= BATCH_SIZE:
            _upsert_batch(store, model, texts, metadatas, ids)
            texts, metadatas, ids = [], [], []
            print(f"   ↳ Processed up to row {i} ({store.count()} total stored)...")

    if texts:
        _upsert_batch(store, model, texts, metadatas, ids)

    print(f"\n🎉 Done! Vector store now has {store.count()} chunks.")


def _upsert_batch(store, model, texts, metadatas, ids):
    embeddings = model.encode(texts, show_progress_bar=False).tolist()
    store.upsert(documents=texts, embeddings=embeddings,
                 metadatas=metadatas, ids=ids)


if __name__ == "__main__":
    start = time.time()
    ingest_hf_dataset()
    print(f"⏱️  Total time: {time.time() - start:.1f}s")
