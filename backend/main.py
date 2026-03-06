"""
FastAPI Backend — Customer Support Ticket Triage & Reply System
"""

import os
import time
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import func

from classifier import classify
from retriever import retrieve
from reply_generator import generate_reply
from models import SessionLocal, EscalatedTicket, Telemetry, init_db
from embeddings import get_vector_store, refresh_collection, collection_size
from sentence_transformers import SentenceTransformer

load_dotenv()

app = FastAPI(title="Support Triage API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "admin123")

_st_model = None


def get_st_model():
    global _st_model
    if _st_model is None:
        _st_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _st_model


# ── DB initialisation on startup ────────────────────────────────
@app.on_event("startup")
def startup():
    init_db()
    get_vector_store()  # warm up vector store (load from disk)


# ── DB Session dependency ────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Admin auth dependency ────────────────────────────────────────
def require_admin(x_admin_secret: str = Header(...)):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: invalid admin secret")


# ────────────────────────────────────────────────────────────────
# Pydantic schemas
# ────────────────────────────────────────────────────────────────
class TicketRequest(BaseModel):
    subject: str
    description: str
    channel: Optional[str] = "web"
    timestamp: Optional[str] = None


class AdminReplyBody(BaseModel):
    admin_reply: str


# ────────────────────────────────────────────────────────────────
# USER ENDPOINT — Triage a ticket
# ────────────────────────────────────────────────────────────────
@app.post("/triage")
async def triage_ticket(req: TicketRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    ticket_text = f"Subject: {req.subject}\n\n{req.description}"

    # 1. Classify category & urgency
    clf = classify(ticket_text)

    # 2. Summary (first 150 chars)
    summary = req.description[:150].strip()
    if len(req.description) > 150:
        summary += "..."

    # 3. Retrieve from KB
    docs, sources, scores, best_score, confident = retrieve(ticket_text)

    # 4. LOW CONFIDENCE → escalate to admin queue
    if not confident:
        ticket = EscalatedTicket(
            ticket_text=ticket_text,
            category=clf["category"],
            urgency=clf["urgency"],
            summary=summary,
        )
        db.add(ticket)
        
        latency = int((time.time() - start_time) * 1000)
        tel = Telemetry(
            endpoint="triage",
            generated_reply=False,
            latency_ms=latency,
            prompt_tokens=0, completion_tokens=0, total_tokens=0
        )
        db.add(tel)
        
        db.commit()
        db.refresh(ticket)

        return {
            "category": clf["category"],
            "urgency": clf["urgency"],
            "summary": summary,
            "draft_reply": (
                "Thank you for reaching out! 🙏\n\n"
                "I don't have enough specific information to resolve your query right now. "
                "I've escalated your complaint to our support team — "
                "please check back in **1 hour** and we'll have a personalised response ready for you.\n\n"
                "Sorry for the inconvenience!"
            ),
            "sources": [],
            "confidence": round(best_score, 3),
            "escalated": True,
            "ticket_id": ticket.id,
        }

    # 5. HIGH CONFIDENCE → generate grounded reply
    reply_data = generate_reply(ticket_text, docs, clf["category"])
    
    latency = int((time.time() - start_time) * 1000)
    tel = Telemetry(
        endpoint="triage",
        generated_reply=True,
        latency_ms=latency,
        prompt_tokens=reply_data.get("prompt_tokens", 0),
        completion_tokens=reply_data.get("completion_tokens", 0),
        total_tokens=reply_data.get("total_tokens", 0)
    )
    db.add(tel)
    db.commit()

    # Generate snippets from docs for citations
    unique_snippets = []
    for doc in docs:
        if "Resolution:" in doc:
            snippet = doc.split("Resolution:")[1].strip()
        else:
            snippet = doc.strip()
            
        snippet = (snippet[:120] + "...") if len(snippet) > 120 else snippet
        if snippet not in unique_snippets:
            unique_snippets.append(snippet)
            
    return {
        "category": clf["category"],
        "urgency": clf["urgency"],
        "summary": summary,
        "draft_reply": reply_data["reply"],
        "sources": unique_snippets,
        "confidence": round(best_score, 3),
        "escalated": False,
        "ticket_id": None,
    }


# ────────────────────────────────────────────────────────────────
# ADMIN ENDPOINTS
# ────────────────────────────────────────────────────────────────
@app.get("/admin/tickets/pending")
def get_pending_tickets(db: Session = Depends(get_db), _=Depends(require_admin)):
    tickets = (
        db.query(EscalatedTicket)
        .filter_by(resolved=False)
        .order_by(EscalatedTicket.created_at.desc())
        .all()
    )
    return [_ticket_to_dict(t) for t in tickets]


@app.get("/admin/tickets/resolved")
def get_resolved_tickets(db: Session = Depends(get_db), _=Depends(require_admin)):
    tickets = (
        db.query(EscalatedTicket)
        .filter_by(resolved=True)
        .order_by(EscalatedTicket.resolved_at.desc())
        .all()
    )
    return [_ticket_to_dict(t) for t in tickets]


@app.post("/admin/tickets/{ticket_id}/reply")
def admin_reply_to_ticket(
    ticket_id: int,
    body: AdminReplyBody,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    ticket = db.query(EscalatedTicket).filter_by(id=ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.resolved:
        raise HTTPException(status_code=400, detail="Ticket already resolved")

    # Save admin reply
    ticket.admin_reply = body.admin_reply
    ticket.resolved = True
    ticket.resolved_at = datetime.utcnow()
    db.commit()

    # ── SELF-LEARNING: embed new Q&A pair into VectorStore ─────────
    try:
        new_chunk = (
            f"{ticket.ticket_text}\n\n"
            f"Resolution (Admin): {body.admin_reply}"
        )
        model = get_st_model()
        embedding = model.encode([new_chunk]).tolist()
        store = refresh_collection()  # force reload from disk
        store.upsert(
            documents=[new_chunk],
            embeddings=embedding,
            metadatas=[{"source": f"admin_resolved_{ticket_id}", "category": ticket.category}],
            ids=[f"admin_{ticket_id}"],
        )
        kb_updated = True
    except Exception as e:
        kb_updated = False
        print(f"⚠️  KB update failed: {e}")

    return {
        "message": "Reply saved successfully ✅",
        "kb_updated": kb_updated,
        "ticket_id": ticket_id,
    }


@app.get("/admin/stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    total = db.query(EscalatedTicket).count()
    pending = db.query(EscalatedTicket).filter_by(resolved=False).count()
    resolved = db.query(EscalatedTicket).filter_by(resolved=True).count()
    kb_size = collection_size()
    return {
        "total_escalated": total,
        "pending": pending,
        "resolved": resolved,
        "kb_chunks": kb_size,
    }


@app.get("/admin/telemetry")
def admin_telemetry(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_requests = db.query(Telemetry).count()
    ai_resolved = db.query(Telemetry).filter_by(generated_reply=True).count()
    escalated = total_requests - ai_resolved
    
    avg_latency = db.query(func.avg(Telemetry.latency_ms)).scalar() or 0
    total_tokens = db.query(func.sum(Telemetry.total_tokens)).scalar() or 0
    
    return {
        "total_requests": total_requests,
        "ai_resolved": ai_resolved,
        "escalated": escalated,
        "resolution_rate_pct": round((ai_resolved / total_requests * 100), 1) if total_requests > 0 else 0,
        "avg_latency_ms": int(avg_latency),
        "total_tokens_used": total_tokens,
    }


# ── Health check ─────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "kb_chunks": collection_size()}


# ── Helper ───────────────────────────────────────────────────────
def _ticket_to_dict(t: EscalatedTicket) -> dict:
    return {
        "id": t.id,
        "ticket_text": t.ticket_text,
        "category": t.category,
        "urgency": t.urgency,
        "summary": t.summary,
        "admin_reply": t.admin_reply,
        "resolved": t.resolved,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
    }
