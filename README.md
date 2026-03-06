# SupportIQ — AI-Powered Customer Support Triage Engine

<div align="center">

![SupportIQ Banner](https://img.shields.io/badge/SupportIQ-AI%20Triage%20Engine-2563EB?style=for-the-badge&logo=robot&logoColor=white)
&nbsp;
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)
&nbsp;
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs)
&nbsp;
![Gemini](https://img.shields.io/badge/Gemini%20API-Google-4285F4?style=flat-square&logo=google&logoColor=white)
&nbsp;
![VectorStore](https://img.shields.io/badge/VectorStore-NumPy%20%2B%20Pickle-orange?style=flat-square)

**Automatically classify, retrieve, and respond to customer support tickets using RAG + Gemini AI. Escalate low-confidence tickets to a human admin dashboard with self-learning KB integration.**

</div>

---

## 📌 What is SupportIQ?

SupportIQ is a full-stack AI support triage platform. When a customer submits a ticket:

1. **Classifies** the category (e.g. IT Support, Billing) and urgency (High / Medium / Low) via keyword-based rule engine
2. **Retrieves** the most relevant knowledge-base chunks using semantic search (custom NumPy vector store + Sentence Transformers)
3. **Generates** a grounded reply using Google Gemini — citing KB snippets
4. **Escalates** low-confidence tickets to an admin queue for human review
5. **Self-learns** — when an admin resolves a ticket, the resolution is embedded back into the vector KB for future use

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  /              → Chatbot (ticket submission)        │
│  /admin/login   → Admin authentication               │
│  /admin/dashboard → Escalation console + analytics   │
└─────────────────────────┬────────────────────────────┘
                          │ HTTP (Axios)
┌─────────────────────────▼────────────────────────────┐
│                 Backend (FastAPI)                    │
│  POST /triage              → AI triage pipeline      │
│  GET  /admin/stats         → Dashboard stats         │
│  GET  /admin/tickets/*     → Ticket management       │
│  POST /admin/tickets/reply → Publish + KB learn      │
│  GET  /admin/telemetry     → AI performance metrics  │
└────┬───────────────────────────┬─────────────────────┘
     │                           │
┌────▼──────┐            ┌───────▼──────────┐
│  ChromaDB │            │  SQLite (SQLAlch)│
│  Vector   │            │  Tickets +       │
│  Store    │            │  Telemetry logs  │
└────┬──────┘            └──────────────────┘
     │
┌────▼──────────────────────┐
│  Google Gemini API        │
│  (reply generation)       │
└───────────────────────────┘
```

---

## 🗂️ Project Structure

```
SupportIQ/
├── backend/
│   ├── main.py              # FastAPI app + all API endpoints
│   ├── classifier.py        # Rule-based category + urgency classifier
│   ├── retriever.py         # ChromaDB semantic retrieval
│   ├── reply_generator.py   # Gemini-powered reply generation
│   ├── embeddings.py        # Vector store management (ChromaDB)
│   ├── models.py            # SQLAlchemy models (tickets, telemetry)
│   ├── dataset_loader.py    # Dataset ingestion from HuggingFace
│   ├── kb_ingestion.py      # Knowledge base PDF/text ingestion
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables (not committed)
│
└── frontend/
    ├── app/
    │   ├── page.tsx              # Chatbot interface
    │   ├── admin/login/page.tsx  # Admin login
    │   └── admin/dashboard/page.tsx  # Admin console
    └── ...
```

---

## ⚙️ Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | ≥ 3.10 | For the backend |
| Next.js | ≥ 18 | For the frontend |
| npm | ≥ 9 | Bundled with Node.js |
| Google Gemini API Key | — | Free tier available at [aistudio.google.com](https://aistudio.google.com) |

---

## 🚀 Setup & Installation

### 1 — Clone the repository

```bash
git clone https://github.com/your-username/supportiq.git
cd supportiq
```

---

### 2 — Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Create your `.env` file

Create a file named `.env` inside the `backend/` directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
ADMIN_SECRET=your_secure_admin_password_here
```

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key | **Required** |
| `ADMIN_SECRET` | Password for the admin dashboard | `admin123` |

> ⚠️ **Never commit your `.env` file.** Add it to `.gitignore`.

#### Ingest the Knowledge Base (first run only)

```bash
# Load the support ticket dataset into ChromaDB
python dataset_loader.py
```

This downloads a support ticket dataset from HuggingFace and builds the vector index. It may take **3–5 minutes** on first run. The resulting `vector_store.pkl` is saved locally.

#### Start the backend server

```bash
uvicorn main:app --reload --port 8000
```

The API is now live at **`http://localhost:8000`**

> The interactive Swagger docs are available at `http://localhost:8000/docs`

---

### 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
```

The frontend is now live at **`http://localhost:3000`**

---

## 🌐 Usage

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Customer chatbot for ticket submission |
| `http://localhost:3000/admin/login` | Admin portal login |
| `http://localhost:3000/admin/dashboard` | Escalation console + AI metrics |

**Default admin password:** value of `ADMIN_SECRET` in your `.env` (defaults to `admin123`)

---

## 📡 API Reference

All endpoints are served at `http://localhost:8000`.

---

### `POST /triage` — Submit a Support Ticket

The core endpoint. Classifies the ticket, searches the KB, and either returns an AI-generated reply or escalates to the admin queue.

**Request**

```bash
curl -X POST http://localhost:8000/triage \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Cannot log in to my account",
    "description": "I have been locked out of my account for 2 days. I tried resetting my password but the email never arrives.",
    "channel": "web"
  }'
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | ✅ | Short ticket title |
| `description` | string | ✅ | Detailed issue description |
| `channel` | string | ❌ | Source channel (default: `"web"`) |

**Response — High Confidence (AI resolved)**

```json
{
  "category": "IT Support",
  "urgency": "Medium",
  "summary": "I have been locked out of my account for 2 days. I tried resetting my password ...",
  "draft_reply": "Hi! I understand how frustrating it can be to lose access to your account...",
  "sources": [
    "For password reset issues, navigate to the login page and click 'Forgot Password'...",
    "If the reset email does not arrive within 5 minutes, check your spam folder..."
  ],
  "confidence": 0.842,
  "escalated": false,
  "ticket_id": null
}
```

**Response — Low Confidence (escalated to admin)**

```json
{
  "category": "Technical Support",
  "urgency": "High",
  "summary": "My entire database got wiped after the last update...",
  "draft_reply": "Thank you for reaching out! 🙏\n\nI don't have enough specific information to resolve your query right now. I've escalated your complaint to our support team — please check back in 1 hour...",
  "sources": [],
  "confidence": 0.312,
  "escalated": true,
  "ticket_id": 47
}
```

---

### `GET /health` — Health Check

```bash
curl http://localhost:8000/health
```

```json
{
  "status": "ok",
  "kb_chunks": 3842
}
```

---

### `GET /admin/stats` — Dashboard Statistics

Requires the `x-admin-secret` header.

```bash
curl http://localhost:8000/admin/stats \
  -H "x-admin-secret: your_admin_password"
```

```json
{
  "total_escalated": 128,
  "pending": 12,
  "resolved": 116,
  "kb_chunks": 3954
}
```

---

### `GET /admin/telemetry` — AI Performance Metrics

```bash
curl http://localhost:8000/admin/telemetry \
  -H "x-admin-secret: your_admin_password"
```

```json
{
  "total_requests": 540,
  "ai_resolved": 489,
  "escalated": 51,
  "resolution_rate_pct": 90.6,
  "avg_latency_ms": 1423,
  "total_tokens_used": 214800
}
```

---

### `GET /admin/tickets/pending` — List Pending Escalations

```bash
curl http://localhost:8000/admin/tickets/pending \
  -H "x-admin-secret: your_admin_password"
```

```json
[
  {
    "id": 47,
    "ticket_text": "Subject: Database wiped\n\nMy entire database got wiped after the last update...",
    "category": "Technical Support",
    "urgency": "High",
    "summary": "My entire database got wiped after the last update...",
    "admin_reply": null,
    "resolved": false,
    "created_at": "2026-03-06T03:22:14",
    "resolved_at": null
  }
]
```

---

### `GET /admin/tickets/resolved` — List Resolved Tickets

```bash
curl http://localhost:8000/admin/tickets/resolved \
  -H "x-admin-secret: your_admin_password"
```

Returns the same structure as pending tickets, but with `resolved: true` and a `resolved_at` timestamp.

---

### `POST /admin/tickets/{id}/reply` — Publish Resolution + Train KB

Resolves a ticket and **automatically embeds the Q&A pair into the vector knowledge base** so the AI learns from this resolution.

```bash
curl -X POST http://localhost:8000/admin/tickets/47/reply \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your_admin_password" \
  -d '{
    "admin_reply": "This issue was caused by a migration bug in v2.4.1. Please restore from the automated backup created at 02:00 UTC. Steps: Settings → Backups → Restore → Select latest snapshot."
  }'
```

```json
{
  "message": "Reply saved successfully ✅",
  "kb_updated": true,
  "ticket_id": 47
}
```

> 🧠 When `kb_updated: true`, the ticket text + admin resolution are vectorised and inserted into ChromaDB. Future similar tickets will now be automatically resolved using this knowledge.

---

## 🧠 How the AI Pipeline Works

```
User submits ticket
        │
        ▼
┌──────────────┐
│  Classifier  │  → keyword rules → Category + Urgency
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Retriever   │  → SentenceTransformer embeds query
│              │  → ChromaDB cosine similarity search
│              │  → Returns top-k KB chunks + confidence score
└──────┬───────┘
       │
       ├─── confidence < threshold ──→ Escalate to admin queue
       │
       ▼
┌──────────────┐
│  Reply Gen.  │  → Gemini API (grounded on retrieved KB chunks)
│  (Gemini)    │  → Returns structured reply + token metrics
└──────────────┘
```

---

## 🔒 Security Notes

- The admin dashboard is protected by a **header-based secret** (`x-admin-secret`)
- Change the default `ADMIN_SECRET` from `admin123` before any production deployment
- Never commit your `.env` file — add it to `.gitignore`
- For production, replace the `allow_origins=["*"]` CORS policy in `main.py` with your actual frontend domain

---

## 🛠️ Development Notes

### Re-ingesting the Knowledge Base

If you add new documents or want to reset the KB:

```bash
cd backend
python kb_ingestion.py    # for PDF/text files
# or
python dataset_loader.py  # for HuggingFace dataset
```

### Environment Variables Summary

```env
# backend/.env
GEMINI_API_KEY=AIza...          # Google Gemini API key
ADMIN_SECRET=your_secret_here   # Admin dashboard password
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend URL
```

---

## 📦 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15, React, CSS Variables | Chatbot UI + Admin console |
| **Backend** | FastAPI, Uvicorn | REST API server |
| **AI Model** | Google Gemini API | Reply generation |
| **Embeddings** | Sentence Transformers (`all-MiniLM-L6-v2`) | Semantic search |
| **Vector DB** | Custom NumPy + Pickle (`vector_store.pkl`) | Knowledge base storage + cosine similarity retrieval — replaces ChromaDB for Python 3.14 compat |
| **Database** | SQLite + SQLAlchemy | Ticket storage + telemetry |
| **Dataset** | HuggingFace `datasets` | Initial KB seeding |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">
Built with ❤️ using FastAPI + Next.js + Google Gemini
</div>
