"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Ticket = {
  id: number;
  ticket_text: string;
  category: string;
  urgency: string;
  summary: string;
  admin_reply: string | null;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
};

type Stats = {
  total_escalated: number;
  pending: number;
  resolved: number;
  kb_chunks: number;
};

type TelemetryStats = {
  total_requests: number;
  ai_resolved: number;
  escalated: number;
  resolution_rate_pct: number;
  avg_latency_ms: number;
  total_tokens_used: number;
};

const URGENCY_DOT: Record<string, string> = {
  High: "#EF4444", Medium: "#F59E0B", Low: "#10B981",
};

const URGENCY_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  High: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  Medium: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  Low: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
};

const CATEGORY_ICONS: Record<string, string> = {
  "Returns and Exchanges": "💸", "IT Support": "🔐", "Customer Service": "🚚",
  "Billing and Payments": "🧾", "Human Resources": "👤", "Technical Support": "⚙️",
  "Service Outages and Maintenance": "🔌", "Sales and Pre-Sales": "🤝",
  "Product Support": "📦", "General Inquiry": "💬", "Other": "💬",
};

export default function DashboardPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryStats | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedSecret = sessionStorage.getItem("adminSecret");
    if (!storedSecret) {
      router.push("/admin/login");
    } else {
      setSecret(storedSecret);
    }
  }, [router]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    if (!secret) return;
    const headers = { "x-admin-secret": secret };
    try {
      const [pending, resolved, statsRes, telRes] = await Promise.all([
        axios.get<Ticket[]>(`${API}/admin/tickets/pending`, { headers }),
        axios.get<Ticket[]>(`${API}/admin/tickets/resolved`, { headers }),
        axios.get<Stats>(`${API}/admin/stats`, { headers }),
        axios.get<TelemetryStats>(`${API}/admin/telemetry`, { headers }),
      ]);
      setTickets(pending.data);
      setResolvedTickets(resolved.data);
      setStats(statsRes.data);
      setTelemetry(telRes.data);
    } catch {
      sessionStorage.removeItem("adminSecret");
      router.push("/admin/login");
    }
  }, [secret, router]);

  useEffect(() => {
    if (secret) fetchAll();
  }, [secret, fetchAll]);

  const handleReply = async (ticketId: number) => {
    const text = replyText[ticketId]?.trim();
    if (!text || !secret) return;
    setSubmitting(ticketId);
    const headers = { "x-admin-secret": secret };
    try {
      await axios.post(`${API}/admin/tickets/${ticketId}/reply`, { admin_reply: text }, { headers });
      showToast("Reply published and synced to Knowledge Base.", "success");
      await fetchAll();
      setExpandedId(null);
    } catch {
      showToast("Failed to submit reply. Please try again.", "error");
    } finally {
      setSubmitting(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminSecret");
    router.push("/admin/login");
  };

  if (!secret) return null;

  const currentList = activeTab === "pending" ? tickets : resolvedTickets;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;500;600&display=swap');

        :root {
          --bg:             #F0F8FF;
          --bg-secondary:   #E4F2FD;
          --surface:        #FFFFFF;
          --surface-2:      #F5FAFF;
          --border:         #C8E4F8;
          --border-hover:   #7DC5F0;
          --text-primary:   #0F172A;
          --text-secondary: #334E68;
          --text-muted:     #6B8CAE;
          --accent:         #1D6FD8;
          --accent-hover:   #1558B0;
          --accent-light:   #E0EEFB;
          --accent-light-border: #93C5FD;
          --success:        #10B981;
          --success-light:  #ECFDF5;
          --warning:        #F59E0B;
          --warning-light:  #FFFBEB;
          --danger:         #EF4444;
          --danger-light:   #FEF2F2;
          --btn-grad:        linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%);
          --btn-grad-hover:  linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
          --btn-grad-active: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 50%, #1E3A8A 100%);
          --shadow-sm:   0 1px 3px rgba(15,80,180,0.08);
          --shadow-md:   0 4px 14px rgba(15,80,180,0.1);
          --shadow-lg:   0 10px 30px rgba(15,80,180,0.12);
          --shadow-btn:  0 4px 14px rgba(37,99,235,0.4);
          --shadow-focus:0 0 0 3px rgba(37,99,235,0.28);
          --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;
          --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          font-family: 'Inter', sans-serif;
          background: #F0F8FF !important;
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
        }

        .dash-root { min-height: 100vh; display: flex; flex-direction: column; }

        /* ── Toast ── */
        .toast {
          position: fixed; top: 20px; right: 20px; z-index: 100;
          display: flex; align-items: center; gap: 10px;
          padding: 12px 18px;
          border-radius: var(--radius-md);
          font-size: 13px; font-weight: 600;
          box-shadow: var(--shadow-lg);
          animation: slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(12px);
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }

        .toast-success {
          background: #ECFDF5;
          border: 1.5px solid #A7F3D0;
          color: #065F46;
          box-shadow: var(--shadow-lg);
        }

        .toast-error {
          background: #FEF2F2;
          border: 1.5px solid #FECACA;
          color: #B91C1C;
        }

        /* ── Nav ── */
        .dash-nav {
          background: rgba(240,248,255,0.9);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid var(--border);
          height: 62px;
          display: flex; align-items: center;
          padding: 0 40px;
          position: sticky; top: 0; z-index: 50;
          gap: 14px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }

        @media (prefers-color-scheme: dark) {
          .dash-nav { background: rgba(15,23,42,0.9); }
        }

        .nav-logo {
          width: 34px; height: 34px;
          background: var(--accent);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
          transition: var(--transition);
        }

        .nav-logo:hover { background: var(--accent-hover); transform: scale(1.06); }

        .nav-brand {
          font-family: 'Lora', serif;
          font-size: 17px; font-weight: 600;
          color: var(--text-primary);
        }

        .nav-divider {
          width: 1px; height: 18px;
          background: var(--border);
        }

        .nav-section {
          font-size: 13px; font-weight: 500;
          color: var(--text-muted);
        }

        .nav-right {
          margin-left: auto;
          display: flex; align-items: center; gap: 10px;
        }

        .nav-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }

        .nav-btn:hover {
          background: var(--accent-light);
          border-color: var(--accent);
          color: var(--accent);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .nav-btn:active { transform: translateY(0); }

        .nav-btn:focus-visible {
          outline: none;
          box-shadow: var(--shadow-focus);
        }

        .nav-btn-danger {
          color: var(--danger);
          border-color: #FECACA;
          background: var(--danger-light);
        }

        .nav-btn-danger:hover {
          background: var(--btn-grad);
          color: white;
          border-color: transparent;
          box-shadow: var(--shadow-btn);
        }

        /* ── Body ── */
        .dash-body {
          flex: 1; padding: 36px 40px;
          max-width: 1240px; width: 100%;
          margin: 0 auto;
          display: flex; flex-direction: column; gap: 28px;
          animation: fadeSlideUp 0.3s ease;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .page-eyebrow {
          font-size: 11px; font-weight: 700;
          color: var(--accent); letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 5px;
          display: flex; align-items: center; gap: 8px;
        }

        .page-eyebrow::before {
          content: ''; width: 20px; height: 2px;
          background: var(--accent); border-radius: 2px;
        }

        .page-title {
          font-family: 'Lora', serif;
          font-size: 26px; font-weight: 600;
          color: var(--text-primary); letter-spacing: -0.3px;
        }

        /* ── Stats Grid ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .stat-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px 22px;
          display: flex; align-items: center; gap: 16px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
          cursor: default;
        }

        .stat-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-md);
          transform: translateY(-3px);
        }

        .stat-icon-wrap {
          width: 44px; height: 44px;
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
          transition: var(--transition);
        }

        .stat-card:hover .stat-icon-wrap { transform: scale(1.1); }

        .stat-info { display: flex; flex-direction: column; gap: 3px; }

        .stat-label {
          font-size: 11px; font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.07em;
        }

        .stat-value {
          font-family: 'Lora', serif;
          font-size: 28px; font-weight: 600;
          color: var(--text-primary); line-height: 1;
        }

        /* ── Panel ── */
        .panel {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          flex: 1;
          box-shadow: var(--shadow-md);
          transition: var(--transition);
        }

        /* ── Tabs ── */
        .tab-bar {
          display: flex;
          border-bottom: 1.5px solid var(--border);
          background: var(--surface-2);
          padding: 0 8px;
        }

        .tab-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 14px 20px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 600;
          color: var(--text-muted);
          background: transparent; border: none;
          border-bottom: 2.5px solid transparent;
          margin-bottom: -1.5px;
          cursor: pointer;
          transition: var(--transition);
        }

        .tab-btn:hover { color: var(--text-secondary); background: var(--bg-secondary); border-radius: 8px 8px 0 0; }

        .tab-btn.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }

        .tab-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); border-radius: 6px; }

        .tab-count {
          font-size: 11px; font-weight: 700;
          padding: 2px 8px; border-radius: 10px;
          background: var(--bg-secondary);
          color: var(--text-muted);
          transition: var(--transition);
        }

        .tab-btn.active .tab-count {
          background: var(--accent-light);
          color: var(--accent);
          border: 1px solid var(--accent-light-border);
        }

        /* ── Ticket list ── */
        .ticket-list {
          padding: 16px;
          display: flex; flex-direction: column; gap: 10px;
        }

        /* ── Empty state ── */
        .empty-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 72px 20px; gap: 12px;
        }

        .empty-icon {
          width: 60px; height: 60px;
          background: var(--surface-2);
          border: 1.5px solid var(--border);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; margin-bottom: 4px;
        }

        .empty-title {
          font-family: 'Lora', serif;
          font-size: 18px; font-weight: 600;
          color: var(--text-primary);
        }

        .empty-sub {
          font-size: 13px; color: var(--text-muted);
          font-weight: 500; text-align: center;
          max-width: 340px; line-height: 1.7;
        }

        /* ── Ticket card ── */
        .ticket-card {
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--surface);
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }

        .ticket-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .ticket-card.expanded {
          border-color: var(--accent);
          box-shadow: var(--shadow-md), var(--shadow-focus);
        }

        .ticket-header {
          width: 100%; background: transparent; border: none;
          padding: 16px 18px;
          display: flex; align-items: center; gap: 14px;
          cursor: pointer; text-align: left;
          transition: var(--transition);
        }

        .ticket-header:hover { background: var(--surface-2); }
        .ticket-header:focus-visible { outline: none; box-shadow: inset var(--shadow-focus); }

        .ticket-id-badge {
          font-size: 11px; font-weight: 700;
          color: var(--text-muted);
          background: var(--surface-2);
          border: 1px solid var(--border);
          padding: 4px 8px; border-radius: 6px;
          font-family: 'Inter', monospace;
          flex-shrink: 0;
          transition: var(--transition);
        }

        .ticket-card:hover .ticket-id-badge {
          border-color: var(--border-hover);
          color: var(--accent);
        }

        .ticket-meta { flex: 1; min-width: 0; }
        .ticket-top  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }

        .ticket-category {
          font-size: 13px; font-weight: 600;
          color: var(--text-primary);
        }

        .urgency-badge {
          font-size: 11px; font-weight: 600;
          padding: 3px 9px; border-radius: 6px;
          letter-spacing: 0.03em;
          display: flex; align-items: center; gap: 5px;
          border: 1px solid;
          transition: var(--transition);
        }

        .urgency-badge:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }

        .urgency-dot { width: 5px; height: 5px; border-radius: 50%; }

        .resolved-badge {
          font-size: 11px; font-weight: 600;
          padding: 3px 9px; border-radius: 6px;
          background: var(--success-light);
          color: var(--success);
          border: 1px solid #A7F3D0;
        }

        .ticket-summary {
          font-size: 13px; color: var(--text-secondary);
          line-height: 1.5;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 500px;
        }

        .ticket-right {
          display: flex; align-items: center; gap: 14px;
          flex-shrink: 0;
        }

        .ticket-date {
          font-size: 11.5px; color: var(--text-muted); font-weight: 500;
        }

        .chevron {
          color: var(--text-muted);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
        }

        .chevron.open { transform: rotate(180deg); color: var(--accent); }

        /* ── Expanded ticket body ── */
        .ticket-body {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px; padding: 18px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
          animation: expandDown 0.25s ease;
        }

        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ticket-meta-bar {
          grid-column: span 2;
          display: flex; gap: 20px;
          font-size: 11.5px; color: var(--text-muted);
          font-weight: 500; padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }

        .meta-resolved { color: var(--success); }

        .section-label {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 6px;
          transition: var(--transition);
        }

        .text-box {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          font-size: 13.5px; line-height: 1.7;
          color: var(--text-secondary);
          white-space: pre-wrap;
          transition: var(--transition);
        }

        .text-box:hover { border-color: var(--border-hover); }

        .resolved-box {
          background: var(--success-light);
          border: 1.5px solid #A7F3D0;
          border-radius: var(--radius-md);
          padding: 14px 16px;
          font-size: 13.5px; line-height: 1.7;
          color: var(--text-secondary);
          white-space: pre-wrap;
        }

        @media (prefers-color-scheme: dark) {
          .resolved-box { border-color: rgba(16,185,129,0.2); }
        }

        .reply-textarea {
          width: 100%;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px; line-height: 1.7;
          color: var(--text-primary);
          resize: vertical; min-height: 110px;
          outline: none;
          transition: var(--transition);
        }

        .reply-textarea::placeholder { color: var(--text-muted); }
        .reply-textarea:hover { border-color: var(--border-hover); }
        .reply-textarea:focus {
          border-color: var(--accent);
          box-shadow: var(--shadow-focus);
          background: var(--surface);
        }

        .reply-footer {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-top: 10px;
        }

        .kb-note {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600;
          color: var(--text-muted);
        }

        .kb-note svg { color: #7C3AED; }

        .publish-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 20px;
          background: var(--btn-grad);
          color: white; border: none;
          border-radius: var(--radius-md);
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          box-shadow: var(--shadow-btn);
          transition: var(--transition);
        }

        .publish-btn:hover:not(:disabled) {
          background: var(--btn-grad-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.5);
        }

        .publish-btn:active:not(:disabled) {
          background: var(--btn-grad-active);
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(37,99,235,0.35);
        }

        .publish-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

        .publish-btn:disabled {
          background: var(--bg-secondary);
          color: var(--text-muted);
          cursor: not-allowed; transform: none; box-shadow: none;
        }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-body  { padding: 24px 20px; }
          .dash-nav   { padding: 0 20px; }
        }

        @media (max-width: 640px) {
          .ticket-body     { grid-template-columns: 1fr; }
          .ticket-meta-bar { grid-column: 1; }
          .ticket-date     { display: none; }
        }
      `}</style>

      <div className="dash-root">
        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
            {toast.type === "success" ? (
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.msg}
          </div>
        )}

        {/* Nav */}
        <nav className="dash-nav">
          <div className="nav-logo">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <span className="nav-brand">SupportIQ</span>
          <span className="nav-divider" />
          <span className="nav-section">Escalation Console</span>

          <div className="nav-right">
            <button className="nav-btn" onClick={fetchAll}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button className="nav-btn nav-btn-danger" onClick={handleLogout}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </nav>

        <main className="dash-body">
          <div>
            <p className="page-eyebrow">Management</p>
            <h1 className="page-title">Escalation & KB Console</h1>
          </div>

          {/* Stats */}
          {stats && (
            <div className="stats-grid">
              {[
                { label: "Total Escalated", value: stats.total_escalated, icon: "📋", bg: "#EFF6FF" },
                { label: "Pending", value: stats.pending, icon: "⏳", bg: "#FFFBEB" },
                { label: "Resolved", value: stats.resolved, icon: "✅", bg: "#ECFDF5" },
                { label: "KB Chunks", value: stats.kb_chunks.toLocaleString(), icon: "🧠", bg: "#F5F3FF" },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon-wrap" style={{ background: s.bg }}>{s.icon}</div>
                  <div className="stat-info">
                    <span className="stat-label">{s.label}</span>
                    <span className="stat-value">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Telemetry */}
          {telemetry && (
            <div>
              <p className="page-eyebrow" style={{ marginTop: "8px", marginBottom: "14px" }}>Observability</p>
              <div className="stats-grid">
                {[
                  { label: "Total Requests", value: telemetry.total_requests.toLocaleString(), icon: "🌐", bg: "#EFF6FF" },
                  { label: "AI Resolution Rate", value: `${telemetry.resolution_rate_pct}%`, icon: "⚡", bg: "#ECFEFF" },
                  { label: "Avg Latency", value: `${telemetry.avg_latency_ms}ms`, icon: "⏱️", bg: "#FFF1F2" },
                  { label: "Tokens Used", value: telemetry.total_tokens_used.toLocaleString(), icon: "🪙", bg: "#FEFCE8" },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <div className="stat-icon-wrap" style={{ background: s.bg }}>{s.icon}</div>
                    <div className="stat-info">
                      <span className="stat-label">{s.label}</span>
                      <span className="stat-value">{s.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main panel */}
          <div className="panel">
            <div className="tab-bar">
              {(["pending", "resolved"] as const).map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "pending" ? (
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {tab === "pending" ? "Pending Escalations" : "Resolved Archive"}
                  <span className="tab-count">
                    {tab === "pending" ? tickets.length : resolvedTickets.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="ticket-list">
              {currentList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">{activeTab === "pending" ? "🎉" : "📭"}</div>
                  <p className="empty-title">
                    {activeTab === "pending" ? "No Pending Escalations" : "No Archived Tickets"}
                  </p>
                  <p className="empty-sub">
                    {activeTab === "pending"
                      ? "The AI is resolving all requests automatically. No human intervention needed right now."
                      : "Resolved tickets and their knowledge base contributions will appear here."}
                  </p>
                </div>
              ) : (
                currentList.map(ticket => (
                  <div key={ticket.id} className={`ticket-card ${expandedId === ticket.id ? "expanded" : ""}`}>
                    <button
                      className="ticket-header"
                      onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                    >
                      <div className="ticket-id-badge">#{ticket.id}</div>
                      <div className="ticket-meta">
                        <div className="ticket-top">
                          <span className="ticket-category">
                            {CATEGORY_ICONS[ticket.category] ?? "📄"} {ticket.category}
                          </span>
                          <span
                            className="urgency-badge"
                            style={{
                              background: URGENCY_BADGE[ticket.urgency]?.bg ?? URGENCY_BADGE.Low.bg,
                              color: URGENCY_BADGE[ticket.urgency]?.text ?? URGENCY_BADGE.Low.text,
                              borderColor: URGENCY_BADGE[ticket.urgency]?.border ?? URGENCY_BADGE.Low.border,
                            }}
                          >
                            <span className="urgency-dot" style={{ background: URGENCY_DOT[ticket.urgency] ?? URGENCY_DOT.Low }} />
                            {ticket.urgency}
                          </span>
                          {ticket.resolved && <span className="resolved-badge">✓ Resolved</span>}
                        </div>
                        <p className="ticket-summary">{ticket.summary}</p>
                      </div>
                      <div className="ticket-right">
                        <span className="ticket-date">
                          {new Date(ticket.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className={`chevron ${expandedId === ticket.id ? "open" : ""}`}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </div>
                    </button>

                    {expandedId === ticket.id && (
                      <div className="ticket-body">
                        <div className="ticket-meta-bar">
                          <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
                          {ticket.resolved_at && (
                            <span className="meta-resolved">
                              Resolved: {new Date(ticket.resolved_at).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="section-label">
                            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Customer Inquiry
                          </div>
                          <div className="text-box">{ticket.ticket_text}</div>
                        </div>

                        <div>
                          {ticket.resolved && ticket.admin_reply ? (
                            <>
                              <div className="section-label" style={{ color: "#10B981" }}>
                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                KB Resolution
                              </div>
                              <div className="resolved-box">{ticket.admin_reply}</div>
                            </>
                          ) : !ticket.resolved ? (
                            <>
                              <div className="section-label">
                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Draft Resolution
                              </div>
                              <textarea
                                className="reply-textarea"
                                value={replyText[ticket.id] ?? ""}
                                onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                placeholder="Write the resolution here. It will be vectorised and used by the AI for future similar tickets…"
                              />
                              <div className="reply-footer">
                                <span className="kb-note">
                                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Syncs to AI Knowledge Graph
                                </span>
                                <button
                                  className="publish-btn"
                                  onClick={() => handleReply(ticket.id)}
                                  disabled={submitting === ticket.id || !replyText[ticket.id]?.trim()}
                                >
                                  {submitting === ticket.id ? (
                                    <><span className="spinner" /> Syncing…</>
                                  ) : (
                                    <>
                                      Publish & Resolve
                                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                      </svg>
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}