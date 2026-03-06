"""
Rule-based ticket classifier for Category and Urgency.
Can be swapped for a fine-tuned transformer later.
"""

CATEGORIES = {
    "Returns and Exchanges": [
        "refund", "money back", "return", "reimburse", "reimbursement",
        "credit", "charged twice", "overcharged", "duplicate charge", "exchange"
    ],
    "IT Support": [
        "login", "log in", "sign in", "password", "reset password",
        "locked out", "can't access", "authentication", "forgot password",
        "two factor", "2fa", "otp", "verification code", "vpn", "access"
    ],
    "Customer Service": [
        "delivery", "shipping", "package", "courier", "arrived",
        "not received", "tracking", "delayed", "lost package",
        "order status", "dispatch", "shipment"
    ],
    "Billing and Payments": [
        "bill", "billing", "charge", "invoice", "payment", "subscription",
        "plan", "pricing", "autopay", "auto-pay", "transaction", "receipt"
    ],
    "Human Resources": [
        "account", "profile", "delete account", "cancel", "update",
        "username", "email change", "deactivate", "close account", "personal info",
        "hr", "benefits", "payroll", "leave", "vacation"
    ],
    "Technical Support": [
        "bug", "error", "crash", "glitch", "broken", "issue", "technical"
    ],
    "Service Outages and Maintenance": [
        "down", "outage", "maintenance", "offline", "server", "unavailable"
    ],
    "Sales and Pre-Sales": [
        "buy", "purchase", "quote", "sales", "demo", "pricing"
    ],
    "Product Support": [
        "how to", "help with", "usage", "guide", "tutorial", "feature"
    ],
    "General Inquiry": [
        "question", "inquiry", "hello", "hi", "general"
    ]
}

URGENCY_HIGH_KEYWORDS = [
    "urgent", "immediately", "asap", "critical", "broken", "fraud",
    "stolen", "hacked", "unauthorized", "emergency", "severe",
    "not working", "completely broken", "cannot use", "money gone"
]

URGENCY_LOW_KEYWORDS = [
    "question", "curious", "wondering", "general inquiry",
    "just wanted to know", "feedback", "suggestion", "when will", "how does"
]


def classify(text: str) -> dict:
    lower = text.lower()

    # --- Category Detection ---
    category = "Other"
    for cat, keywords in CATEGORIES.items():
        if any(kw in lower for kw in keywords):
            category = cat
            break

    # --- Urgency Detection ---
    if any(w in lower for w in URGENCY_HIGH_KEYWORDS):
        urgency = "High"
    elif any(w in lower for w in URGENCY_LOW_KEYWORDS):
        urgency = "Low"
    else:
        urgency = "Medium"

    return {"category": category, "urgency": urgency}
