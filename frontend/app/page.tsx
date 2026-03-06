"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type TriageResult = {
  category: string;
  urgency: string;
  summary: string;
  draft_reply: string;
  sources: string[];
  confidence: number;
  escalated: boolean;
  ticket_id: number | null;
};

type Message = {
  role: "user" | "bot";
  text?: string;
  result?: TriageResult;
  loading?: boolean;
};

const URGENCY_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  High: { label: "High Priority", dot: "#EF4444", bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  Medium: { label: "Medium Priority", dot: "#F59E0B", bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  Low: { label: "Low Priority", dot: "#10B981", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
};

const CATEGORY_ICONS: Record<string, string> = {
  "Returns and Exchanges": "💸", "IT Support": "🔐", "Customer Service": "🚚",
  "Billing and Payments": "🧾", "Human Resources": "👤", "Technical Support": "⚙️",
  "Service Outages and Maintenance": "🔌", "Sales and Pre-Sales": "🤝",
  "Product Support": "📦", "General Inquiry": "💬", "Other": "💬",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "bot",
    text: "Welcome to SupportIQ. Describe your issue below — our AI will classify it, reference the knowledge base, and prepare a resolution draft for you.",
  }]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || loading) return;
    const userMsg: Message = { role: "user", text: `**${subject}**\n\n${description}` };
    const loadingMsg: Message = { role: "bot", loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setSubject("");
    setDescription("");
    setLoading(true);
    try {
      const res = await axios.post<TriageResult>(`${API}/triage`, { subject, description, channel: "web" });
      setMessages(prev => [...prev.slice(0, -1), { role: "bot", result: res.data }]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: "bot", text: "Connection error. Please ensure the backend server is reachable." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;500;600&display=swap');

        /* ── AliceBlue Design Tokens (always light) ─────────────── */
        :root {
          --bg:              #F0F8FF;
          --bg-secondary:    #E4F2FD;
          --surface:         #FFFFFF;
          --surface-2:       #F5FAFF;
          --border:          #C8E4F8;
          --border-hover:    #7DC5F0;
          --text-primary:    #0F172A;
          --text-secondary:  #334E68;
          --text-muted:      #6B8CAE;
          --accent:          #1D6FD8;
          --accent-2:        #0F4FA8;
          --accent-light:    #E0EEFB;
          --accent-lborder:  #93C5FD;
          --btn-grad:        linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%);
          --btn-grad-hover:  linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
          --btn-grad-active: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 50%, #1E3A8A 100%);
          --shadow-sm:       0 1px 3px rgba(15,80,180,0.08), 0 1px 2px rgba(15,80,180,0.05);
          --shadow-md:       0 4px 14px rgba(15,80,180,0.1), 0 2px 6px rgba(15,80,180,0.06);
          --shadow-lg:       0 10px 30px rgba(15,80,180,0.12), 0 4px 12px rgba(15,80,180,0.07);
          --shadow-btn:      0 4px 14px rgba(37,99,235,0.45);
          --shadow-focus:    0 0 0 3px rgba(37,99,235,0.28);
          --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 20px;
          --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          font-family: 'Inter', sans-serif;
          background: var(--bg) !important;
          color: var(--text-primary);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .chat-root { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); }

        /* ── Gradient mesh background ── */
        .chat-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 50% at 10% 0%, rgba(186,225,255,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 90% 100%, rgba(186,225,255,0.4) 0%, transparent 60%),
            var(--bg);
        }

        .chat-root > * { position: relative; z-index: 1; }

        /* ── Header ── */
        .site-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(240,248,255,0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 64px;
          box-shadow: 0 1px 0 var(--border), var(--shadow-sm);
          transition: var(--transition);
        }

        .header-brand { display: flex; align-items: center; gap: 12px; }

        .header-logo {
          width: 36px; height: 36px;
          background: var(--btn-grad);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          box-shadow: var(--shadow-btn);
          transition: var(--transition);
        }

        .header-logo:hover {
          background: var(--btn-grad-hover);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 20px rgba(37,99,235,0.5);
        }

        .brand-title {
          font-family: 'Lora', serif;
          font-size: 18px; font-weight: 600;
          color: var(--text-primary); letter-spacing: -0.3px;
        }

        .brand-sub {
          font-size: 11px; font-weight: 500;
          color: var(--text-muted); letter-spacing: 0.08em;
          text-transform: uppercase; margin-top: 1px;
        }

        .status-chip {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 14px;
          background: var(--accent-light);
          border: 1px solid var(--accent-lborder);
          border-radius: 20px;
          font-size: 12px; font-weight: 600;
          color: var(--accent);
          transition: var(--transition);
        }

        .status-chip:hover {
          background: #BFDBFE;
          border-color: var(--accent);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .status-dot {
          width: 7px; height: 7px;
          background: #10B981; border-radius: 50%;
          animation: pulse 2.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          50%       { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }

        /* ── Messages ── */
        .messages-area {
          flex: 1; overflow-y: auto;
          padding: 40px 20px 190px;
          display: flex; flex-direction: column; align-items: center;
          scrollbar-width: thin; scrollbar-color: var(--border) transparent;
        }

        .messages-inner {
          width: 100%; max-width: 760px;
          display: flex; flex-direction: column; gap: 22px;
        }

        .msg-row { display: flex; animation: msgIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .msg-row.user { justify-content: flex-end; }
        .msg-row.bot  { justify-content: flex-start; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .bot-avatar {
          width: 36px; height: 36px;
          background: var(--accent-light);
          border: 1.5px solid var(--accent-lborder);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent); flex-shrink: 0;
          margin-right: 10px; margin-top: 2px;
          transition: var(--transition);
        }

        .msg-row:hover .bot-avatar {
          background: var(--btn-grad);
          color: white; border-color: transparent;
          transform: scale(1.08);
          box-shadow: var(--shadow-sm);
        }

        .bubble {
          max-width: 82%; padding: 13px 17px;
          font-size: 14.5px; line-height: 1.65;
          border-radius: var(--radius-lg);
          transition: var(--transition);
        }

        .bubble.user {
          background: var(--btn-grad);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: var(--shadow-btn);
        }

        .bubble.user:hover {
          background: var(--btn-grad-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.45);
        }

        .bubble.bot-text {
          background: var(--surface);
          color: var(--text-primary);
          border: 1.5px solid var(--border);
          border-bottom-left-radius: 4px;
          box-shadow: var(--shadow-sm);
        }

        .bubble.bot-text:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .bubble.loading {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-bottom-left-radius: 4px;
          display: flex; align-items: center; gap: 12px;
          color: var(--text-muted); font-size: 13px; font-weight: 500;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.75s linear infinite; flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Triage Card ── */
        .triage-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          min-width: 340px; max-width: 680px; width: 100%;
          box-shadow: var(--shadow-md);
          transition: var(--transition);
        }

        .triage-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        .escalation-banner {
          padding: 12px 18px;
          background: #FFFBEB;
          border-bottom: 1px solid #FDE68A;
          display: flex; align-items: flex-start; gap: 10px;
        }

        .escalation-icon {
          width: 30px; height: 30px; background: #FEF3C7;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          color: #D97706; flex-shrink: 0;
        }

        .escalation-title { font-size: 13px; font-weight: 600; color: #92400E; margin-bottom: 2px; }
        .escalation-ref   { font-size: 11px; color: #B45309; font-weight: 500; }

        .card-meta {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          background: var(--surface-2);
        }

        .category-chip {
          display: flex; align-items: center; gap: 7px;
          padding: 5px 12px;
          background: var(--accent-light);
          border: 1.5px solid var(--accent-lborder);
          border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 600; color: var(--accent);
          transition: var(--transition);
        }

        .category-chip:hover {
          background: var(--btn-grad);
          color: white; border-color: transparent;
          transform: translateY(-1px);
          box-shadow: var(--shadow-btn);
        }

        .urgency-badge {
          font-size: 11px; font-weight: 600;
          padding: 4px 10px; border-radius: 6px;
          display: flex; align-items: center; gap: 5px;
          border: 1px solid; transition: var(--transition);
        }

        .urgency-badge:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }

        .urgency-dot { width: 6px; height: 6px; border-radius: 50%; }

        .confidence-block { margin-left: auto; display: flex; flex-direction: column; gap: 5px; min-width: 130px; }

        .confidence-labels {
          display: flex; justify-content: space-between;
          font-size: 10px; font-weight: 700;
          color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;
        }

        .conf-pct { color: var(--accent); }
        .conf-track { height: 5px; background: var(--bg-secondary); border-radius: 99px; overflow: hidden; }
        .conf-fill  { height: 100%; border-radius: 99px; transition: width 1.2s cubic-bezier(0.22,1,0.36,1); }

        .card-section {
          padding: 15px 18px;
          border-bottom: 1px solid var(--border);
          transition: var(--transition);
        }

        .card-section:last-child { border-bottom: none; }
        .card-section:hover { background: var(--surface-2); }

        .section-label {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--text-muted); margin-bottom: 10px;
          display: flex; align-items: center; gap: 6px;
        }

        .section-label-accent { color: var(--accent); }

        .summary-text { font-size: 14px; line-height: 1.7; color: var(--text-secondary); }

        .draft-box {
          background: var(--surface-2);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          transition: var(--transition);
        }

        .draft-box:hover { border-color: var(--border-hover); box-shadow: var(--shadow-sm); }

        .draft-text {
          font-size: 13.5px; line-height: 1.75;
          color: var(--text-secondary); white-space: pre-wrap;
        }

        .source-tags { display: flex; flex-direction: column; gap: 7px; }

        .source-tag {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 12.5px; line-height: 1.5; font-weight: 500;
          padding: 9px 12px;
          background: var(--surface-2);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          transition: var(--transition);
        }

        .source-tag svg { margin-top: 2px; flex-shrink: 0; color: var(--accent); transition: var(--transition); }

        .source-tag:hover {
          border-color: var(--accent);
          background: var(--accent-light);
          color: var(--accent);
          transform: translateX(4px);
          box-shadow: var(--shadow-sm);
        }

        /* ── Input Dock ── */
        .input-dock {
          position: fixed; bottom: 0; left: 0; width: 100%;
          padding: 16px 20px 28px;
          background: linear-gradient(to top, rgba(240,248,255,1) 60%, rgba(240,248,255,0));
          display: flex; justify-content: center;
          pointer-events: none; z-index: 40;
        }

        .input-form {
          width: 100%; max-width: 760px;
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden; pointer-events: auto;
          box-shadow: var(--shadow-lg);
          transition: var(--transition);
        }

        .input-form:focus-within {
          border-color: var(--accent);
          box-shadow: var(--shadow-lg), var(--shadow-focus);
        }

        .input-subject {
          width: 100%; padding: 14px 20px 10px;
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 600;
          color: var(--text-primary);
          border: none; outline: none; background: transparent;
        }

        .input-subject::placeholder { color: var(--text-muted); font-weight: 400; }

        .input-divider { height: 1px; background: var(--border); margin: 0 16px; }

        .input-bottom {
          display: flex; align-items: flex-end;
          padding: 10px 12px 12px 20px; gap: 10px;
        }

        .input-desc {
          flex: 1; font-family: 'Inter', sans-serif;
          font-size: 13.5px; color: var(--text-primary);
          border: none; outline: none; resize: none;
          min-height: 50px; max-height: 120px;
          line-height: 1.6; background: transparent;
        }

        .input-desc::placeholder { color: var(--text-muted); }

        /* ── Gradient Submit Button ── */
        .submit-btn {
          height: 44px; padding: 0 22px;
          background: var(--btn-grad);
          color: white; font-weight: 700;
          border: none; border-radius: var(--radius-md);
          font-family: 'Inter', sans-serif;
          font-size: 13px; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          box-shadow: var(--shadow-btn);
          transition: var(--transition);
          flex-shrink: 0; letter-spacing: 0.01em;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--btn-grad-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.5);
        }

        .submit-btn:active:not(:disabled) {
          background: var(--btn-grad-active);
          transform: translateY(0px);
          box-shadow: 0 2px 8px rgba(37,99,235,0.35);
        }

        .submit-btn:focus-visible {
          outline: none; box-shadow: var(--shadow-focus);
        }

        .submit-btn:disabled {
          background: var(--bg-secondary);
          color: var(--text-muted);
          cursor: not-allowed; transform: none; box-shadow: none;
        }

        .submit-btn .btn-arrow {
          transition: transform 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) .btn-arrow {
          transform: translateX(3px);
        }
      `}</style>

      <div className="chat-root">
        <header className="site-header">
          <div className="header-brand">
            <div className="header-logo">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="brand-title">SupportIQ</div>
              <div className="brand-sub">AI Triage Engine</div>
            </div>
          </div>
          <div className="status-chip">
            <span className="status-dot" />
            System Operational
          </div>
        </header>

        <div className="messages-area">
          <div className="messages-inner">
            {messages.map((msg, i) => (
              <div key={i} className={`msg-row ${msg.role}`}>
                {msg.role === "bot" && (
                  <div className="bot-avatar">
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: "8px" }}>
                  {msg.loading && (
                    <div className="bubble loading">
                      <span className="spinner" />
                      Analysing ticket against knowledge base…
                    </div>
                  )}
                  {msg.text && !msg.result && (
                    <div className={`bubble ${msg.role === "user" ? "user" : "bot-text"}`}>
                      {msg.text.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong>
                          : part.split("\n").map((line, k) => (
                            <span key={k}>{line}{k < part.split("\n").length - 1 ? <br /> : null}</span>
                          ))
                      )}
                    </div>
                  )}
                  {msg.result && <TriageCard result={msg.result} />}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="input-dock">
          <form className="input-form" onSubmit={handleSubmit}>
            <input
              className="input-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ticket subject — e.g. VPN not connecting"
              required
            />
            <div className="input-divider" />
            <div className="input-bottom">
              <textarea
                className="input-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your issue in detail…"
                required rows={2}
              />
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <span className="spinner" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} /> : (
                  <>
                    Submit
                    <svg className="btn-arrow" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function TriageCard({ result }: { result: TriageResult }) {
  const pct = Math.round(result.confidence * 100);
  const conf = URGENCY_CONFIG[result.urgency] ?? URGENCY_CONFIG.Low;
  const fillColor = pct >= 70 ? "#10B981" : pct >= 45 ? "#F59E0B" : "#EF4444";
  return (
    <div className="triage-card">
      {result.escalated && (
        <div className="escalation-banner">
          <div className="escalation-icon">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="escalation-title">Escalated to Human Agent</p>
            <p className="escalation-ref">Ticket #{result.ticket_id} · Low confidence resolution</p>
          </div>
        </div>
      )}
      <div className="card-meta">
        <div className="category-chip">
          <span>{CATEGORY_ICONS[result.category] ?? "📄"}</span>
          {result.category}
        </div>
        <span className="urgency-badge" style={{ background: conf.bg, color: conf.text, borderColor: conf.border }}>
          <span className="urgency-dot" style={{ background: conf.dot }} />
          {conf.label}
        </span>
        <div className="confidence-block">
          <div className="confidence-labels">
            <span>Confidence</span>
            <span className="conf-pct">{pct}%</span>
          </div>
          <div className="conf-track">
            <div className="conf-fill" style={{ width: `${pct}%`, background: fillColor }} />
          </div>
        </div>
      </div>
      <div className="card-section">
        <div className="section-label">
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Issue Analysis
        </div>
        <p className="summary-text">{result.summary}</p>
      </div>
      <div className="card-section">
        <div className="section-label section-label-accent">
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Suggested Resolution
        </div>
        <div className="draft-box">
          <p className="draft-text">{result.draft_reply}</p>
        </div>
      </div>
      {result.sources.length > 0 && (
        <div className="card-section">
          <div className="section-label">Knowledge Base Citations</div>
          <div className="source-tags">
            {result.sources.map((src, idx) => (
              <span key={idx} className="source-tag">
                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {src}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}