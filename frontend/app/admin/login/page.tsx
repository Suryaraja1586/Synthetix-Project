"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [inputSecret, setInputSecret] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoading(true);
    try {
      await axios.get(`${API}/admin/stats`, { headers: { "x-admin-secret": inputSecret } });
      sessionStorage.setItem("adminSecret", inputSecret);
      router.push("/admin/dashboard");
    } catch {
      setAuthError("Invalid access code. Please verify your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          --left-bg:        #1E3A5F;
          --left-bg-2:      #162D4A;
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

        .login-root { min-height: 100vh; display: flex; }

        /* ── Left Panel ── */
        .login-left {
          width: 460px; flex-shrink: 0;
          background: linear-gradient(160deg, var(--left-bg) 0%, var(--left-bg-2) 100%);
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 52px 56px;
          position: relative; overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            radial-gradient(circle at 20% 50%, rgba(37,99,235,0.12) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(59,130,246,0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .login-left::after {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
        }

        .left-brand {
          display: flex; align-items: center; gap: 14px;
          position: relative; z-index: 1;
        }

        .left-logo {
          width: 42px; height: 42px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          color: white; backdrop-filter: blur(8px);
          transition: var(--transition);
        }

        .left-logo:hover {
          background: rgba(255,255,255,0.22);
          transform: scale(1.05);
        }

        .left-brand-name {
          font-family: 'Lora', serif;
          font-size: 22px; font-weight: 600;
          color: white; letter-spacing: -0.3px;
        }

        .left-body { position: relative; z-index: 1; }

        .left-heading {
          font-family: 'Lora', serif;
          font-size: 36px; font-weight: 500;
          color: white; line-height: 1.2;
          letter-spacing: -0.5px; margin-bottom: 18px;
        }

        .left-heading em { font-style: italic; color: #93C5FD; }

        .left-desc {
          font-size: 14px; line-height: 1.75;
          color: rgba(255,255,255,0.55);
          max-width: 320px; margin-bottom: 36px;
        }

        .left-features { display: flex; flex-direction: column; gap: 14px; }

        .feature-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-sm);
          transition: var(--transition);
        }

        .feature-row:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateX(4px);
        }

        .feature-icon {
          width: 30px; height: 30px;
          background: rgba(59,130,246,0.2);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          color: #93C5FD; flex-shrink: 0;
        }

        .feature-text {
          font-size: 13px; color: rgba(255,255,255,0.7);
          font-weight: 500;
        }

        .left-footer {
          position: relative; z-index: 1;
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          font-weight: 400; letter-spacing: 0.03em;
        }

        /* ── Right Panel ── */
        .login-right {
          flex: 1; display: flex;
          align-items: center; justify-content: center;
          padding: 40px 60px;
          background: var(--bg);
        }

        .login-card {
          width: 100%; max-width: 420px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          padding: 48px 52px;
          box-shadow: var(--shadow-lg);
          animation: fadeSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          transition: var(--transition);
        }

        .login-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-lg), 0 0 0 1px var(--border-hover);
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .login-eyebrow {
          font-size: 11px; font-weight: 700;
          color: var(--accent); letter-spacing: 0.12em;
          text-transform: uppercase; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }

        .login-eyebrow::before {
          content: '';
          width: 20px; height: 2px;
          background: var(--accent);
          border-radius: 2px;
        }

        .login-title {
          font-family: 'Lora', serif;
          font-size: 30px; font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.5px; margin-bottom: 8px;
        }

        .login-sub {
          font-size: 14px; color: var(--text-secondary);
          margin-bottom: 36px; line-height: 1.6;
        }

        .form-group { margin-bottom: 20px; }

        .form-label {
          display: block; font-size: 12px; font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.06em; text-transform: uppercase;
          margin-bottom: 8px; transition: var(--transition);
        }

        .form-group:focus-within .form-label { color: var(--accent); }

        .input-wrap { position: relative; }

        .input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted); pointer-events: none;
          transition: var(--transition);
        }

        .input-wrap:focus-within .input-icon { color: var(--accent); }

        .form-input {
          width: 100%; padding: 13px 14px 13px 44px;
          font-family: 'Inter', sans-serif;
          font-size: 14px; color: var(--text-primary);
          background: var(--surface-2);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          outline: none;
          transition: var(--transition);
        }

        .form-input::placeholder { color: var(--text-muted); }

        .form-input:hover { border-color: var(--border-hover); }

        .form-input:focus {
          border-color: var(--accent);
          background: var(--surface);
          box-shadow: var(--shadow-focus);
        }

        .error-box {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: var(--radius-md);
          margin-bottom: 20px;
          animation: shake 0.4s ease;
        }

        @media (prefers-color-scheme: dark) {
          .error-box {
            background: rgba(239,68,68,0.08);
            border-color: rgba(239,68,68,0.25);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .error-icon { color: #EF4444; flex-shrink: 0; }
        .error-text { font-size: 13px; color: #B91C1C; font-weight: 500; }

        @media (prefers-color-scheme: dark) {
          .error-text { color: #FCA5A5; }
        }

        .submit-btn {
          width: 100%; padding: 14px;
          background: var(--btn-grad);
          color: white; border: none;
          border-radius: var(--radius-md);
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: var(--shadow-btn);
          transition: var(--transition); margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--btn-grad-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.5);
        }

        .submit-btn:active:not(:disabled) {
          background: var(--btn-grad-active);
          transform: translateY(0);
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

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .security-note {
          display: flex; align-items: center; justify-content: center;
          gap: 7px; margin-top: 22px;
          font-size: 12px; color: var(--text-muted);
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { padding: 40px 24px; }
        }
      `}</style>

      <div className="login-root">
        <aside className="login-left">
          <div className="left-brand">
            <div className="left-logo">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="left-brand-name">SupportIQ</span>
          </div>

          <div className="left-body">
            <h2 className="left-heading">
              Intelligent<br />support, <em>refined</em><br />for your team.
            </h2>
            <p className="left-desc">
              The admin console gives you complete visibility into ticket volume, resolution quality, and team performance.
            </p>
            <div className="left-features">
              {[
                { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Real-time ticket analytics" },
                { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "AI triage performance metrics" },
                { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Agent escalation oversight" },
              ].map((f, i) => (
                <div key={i} className="feature-row">
                  <div className="feature-icon">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon} />
                    </svg>
                  </div>
                  <span className="feature-text">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="left-footer">© {new Date().getFullYear()} SupportIQ — Internal use only</div>
        </aside>

        <main className="login-right">
          <div className="login-card">
            <p className="login-eyebrow">Admin Portal</p>
            <h1 className="login-title">Secure Sign-in</h1>
            <p className="login-sub">Enter your workspace access code to continue to the dashboard.</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Workspace Access Code</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter secure key"
                    value={inputSecret}
                    onChange={e => setInputSecret(e.target.value)}
                    required
                  />
                </div>
              </div>

              {authError && (
                <div className="error-box">
                  <span className="error-icon">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span className="error-text">{authError}</span>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? <span className="spinner" /> : (
                  <>
                    Authenticate & Enter
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="security-note">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Protected by end-to-end authentication
            </div>
          </div>
        </main>
      </div>
    </>
  );
}