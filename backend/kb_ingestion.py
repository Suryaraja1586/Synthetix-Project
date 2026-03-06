"""
Optional: Ingest custom KB files from ./kb/ folder (.txt, .md, .pdf)
Run after dataset_loader.py if you have custom files.
"""

import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
from embeddings import get_chroma_collection

try:
    from pypdf import PdfReader
    HAS_PDF = True
except ImportError:
    HAS_PDF = False


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i: i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks


def read_file(path: Path) -> str:
    if path.suffix == ".pdf":
        if not HAS_PDF:
            print(f"  ⚠️  Skipping PDF {path.name} — pypdf not installed")
            return ""
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return path.read_text(encoding="utf-8", errors="ignore")


def ingest_kb(kb_dir: str = "kb/"):
    kb_path = Path(kb_dir)
    if not kb_path.exists():
        kb_path.mkdir(parents=True)
        print(f"📁 Created empty KB folder at {kb_path.resolve()}. Add .txt/.md/.pdf files and re-run.")
        return

    model = SentenceTransformer("all-MiniLM-L6-v2")
    collection = get_chroma_collection()
    ingested = 0

    for fp in kb_path.rglob("*.*"):
        if fp.suffix.lower() not in [".txt", ".md", ".pdf"]:
            continue

        raw = read_file(fp)
        if not raw.strip():
            continue

        chunks = chunk_text(raw)
        embeddings = model.encode(chunks, show_progress_bar=False).tolist()
        ids = [f"kb_{fp.stem}_{i}" for i in range(len(chunks))]
        metadatas = [{"source": fp.name, "category": "KB"}] * len(chunks)

        collection.upsert(documents=chunks, embeddings=embeddings,
                          metadatas=metadatas, ids=ids)
        ingested += len(chunks)
        print(f"  ✅ {fp.name} → {len(chunks)} chunks")

    print(f"\n🎉 KB ingestion complete. {ingested} chunks added.")


if __name__ == "__main__":
    ingest_kb()
