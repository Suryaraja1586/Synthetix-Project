from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

Base = declarative_base()
engine = create_engine("sqlite:///./admin_queue.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class EscalatedTicket(Base):
    __tablename__ = "escalated_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_text = Column(Text, nullable=False)
    category = Column(String(50), default="Other")
    urgency = Column(String(20), default="Medium")
    summary = Column(Text)
    admin_reply = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(50)) # e.g., 'triage', 'reply'
    generated_reply = Column(Boolean, default=False) # True if AI generated a reply, False if escalated
    latency_ms = Column(Integer, default=0)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)
