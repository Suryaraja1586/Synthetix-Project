"""
Grounded reply generation using Google Gemini.
Only answers from KB context — does NOT hallucinate.
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

_model = None


def get_model():
    global _model
    if _model is None:
        _model = genai.GenerativeModel("gemini-2.5-flash")
    return _model


SYSTEM_PROMPT = """You are a professional, empathetic customer support agent.

STRICT RULES:
1. Answer ONLY based on the Knowledge Base context provided below.
2. If the context does not contain enough information, say EXACTLY:
   "I don't have enough information to resolve this right now. I've escalated your complaint to our support team — please check back in 1 hour."
3. Do NOT make up facts, policies, or steps not in the context.
4. Be concise, warm, and professional.
5. Always acknowledge the customer's frustration before giving the resolution.
6. End with an offer to help further."""


def generate_reply(ticket: str, context_docs: list, category: str) -> dict:
    if not context_docs:
        return {
            "reply": (
                "Thank you for reaching out. I don't have enough information to "
                "resolve this right now. I've escalated your complaint to our support team — "
                "please check back in about 1 hour and we'll have a tailored response ready for you."
            ),
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        }

    context = "\n\n---\n\n".join(context_docs[:5])  # cap at top-5

    prompt = f"""{SYSTEM_PROMPT}

Ticket Category: {category}

--- Knowledge Base Context ---
{context}

--- Customer Ticket ---
{ticket}

--- Your Reply ---"""

    try:
        response = get_model().generate_content(prompt)
        meta = response.usage_metadata
        return {
            "reply": response.text.strip(),
            "prompt_tokens": meta.prompt_token_count if meta else 0,
            "completion_tokens": meta.candidates_token_count if meta else 0,
            "total_tokens": meta.total_token_count if meta else 0,
        }
    except Exception as e:
        return {
            "reply": (
                f"Thank you for contacting us. We are currently experiencing a system issue "
                f"and have escalated your ticket to our support team. "
                f"Please try again in 1 hour. (Error: {str(e)[:100]})"
            ),
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        }
