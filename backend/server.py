from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import Response, HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import asyncio
from html import escape
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from ai_provider import get_provider
from share_image import render_card

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="yesno")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ai_provider = get_provider()

VALID_CERTAINTY = {
    "DEFINITE_YES", "DEFINITE_NO", "PROBABILISTIC",
    "SUBJECTIVE", "TIME_SENSITIVE", "INSUFFICIENT_INFORMATION",
}
VALID_CONFIDENCE = {"high", "medium", "low"}


# ---------- Models ----------
class AnswerRequest(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = (v or "").strip()
        if len(v) < 3:
            raise ValueError("Question is too short.")
        if len(v) > 500:
            raise ValueError("Question is too long.")
        return v


class Source(BaseModel):
    title: str = ""
    publisher: str = ""
    url: str = ""
    date: str = ""
    description: str = ""


class AnswerResponse(BaseModel):
    answer: str
    yesProbability: int
    noProbability: int
    certainty: str
    confidence: str
    shortAnswer: str
    reason: str
    evidence: List[str] = []
    sources: List[Source] = []


class ShareCreate(BaseModel):
    question: str
    result: AnswerResponse


def _sanitize(raw: dict) -> AnswerResponse:
    """Validate & normalise raw LLM output. Never trust it blindly."""
    try:
        yes = int(round(float(raw.get("yesProbability", 50))))
    except (TypeError, ValueError):
        yes = 50
    yes = max(0, min(100, yes))
    no = 100 - yes

    answer = "YES" if yes >= 50 else "NO"

    certainty = str(raw.get("certainty", "PROBABILISTIC")).upper()
    if certainty not in VALID_CERTAINTY:
        certainty = "PROBABILISTIC"

    confidence = str(raw.get("confidence", "medium")).lower()
    if confidence not in VALID_CONFIDENCE:
        confidence = "medium"

    evidence = [str(e).strip() for e in (raw.get("evidence") or []) if str(e).strip()][:5]

    sources: List[Source] = []
    for s in (raw.get("sources") or [])[:6]:
        if isinstance(s, dict) and (s.get("title") or s.get("publisher")):
            sources.append(Source(
                title=str(s.get("title", "")).strip(),
                publisher=str(s.get("publisher", "")).strip(),
                url=str(s.get("url", "")).strip(),
                date=str(s.get("date", "")).strip(),
                description=str(s.get("description", "")).strip(),
            ))

    return AnswerResponse(
        answer=answer,
        yesProbability=yes,
        noProbability=no,
        certainty=certainty,
        confidence=confidence,
        shortAnswer=str(raw.get("shortAnswer", "")).strip(),
        reason=str(raw.get("reason", "")).strip(),
        evidence=evidence,
        sources=sources,
    )


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "yesno api"}


@api_router.post("/answer", response_model=AnswerResponse)
async def answer(req: AnswerRequest):
    try:
        raw = await ai_provider.answer(req.question)
    except Exception as e:
        logger.error(f"AI provider error: {e}")
        raise HTTPException(status_code=502, detail="Could not reach the reasoning engine. Please try again.")

    try:
        result = _sanitize(raw)
    except Exception as e:
        logger.error(f"Failed to parse AI response: {e}")
        raise HTTPException(status_code=502, detail="The answer could not be understood. Please try again.")

    try:
        await db.answers.insert_one({
            "id": str(uuid.uuid4()),
            "question": req.question,
            "answer": result.answer,
            "yesProbability": result.yesProbability,
            "certainty": result.certainty,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning(f"Could not log answer: {e}")

    return result


# ---------- Share ----------
@api_router.post("/share")
async def create_share(payload: ShareCreate):
    question = payload.question.strip()
    if not (3 <= len(question) <= 500):
        raise HTTPException(status_code=422, detail="Invalid question length.")
    sid = secrets.token_urlsafe(6)[:8]
    await db.shares.insert_one({
        "id": sid,
        "question": question,
        "result": payload.result.model_dump(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": sid}


@api_router.get("/share/{sid}")
async def get_share(sid: str):
    doc = await db.shares.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Shared answer not found.")
    return {"question": doc["question"], "result": doc["result"]}


@api_router.get("/s/{sid}/image.png")
async def share_image(sid: str):
    doc = await db.shares.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found.")
    try:
        png = await asyncio.to_thread(render_card, doc["question"], doc["result"])
    except Exception as e:
        logger.error(f"Share image render failed: {e}")
        raise HTTPException(status_code=500, detail="Could not render image.")
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@api_router.get("/s/{sid}")
async def share_page(sid: str, request: Request):
    doc = await db.shares.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Shared answer not found.")

    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    scheme = request.headers.get("x-forwarded-proto", "https")
    base = f"{scheme}://{host}"

    q = doc["question"]
    r = doc["result"]
    ans = r.get("answer", "")
    desc = r.get("shortAnswer", "") or "yesno reduces complicated questions to a clear Yes or No."
    img = f"{base}/api/s/{sid}/image.png"
    redirect = f"/?shared={sid}"
    title = f"{ans} — {q}"

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)}</title>
<meta name="description" content="{escape(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="{escape(title)}">
<meta property="og:description" content="{escape(desc)}">
<meta property="og:image" content="{escape(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{escape(title)}">
<meta name="twitter:description" content="{escape(desc)}">
<meta name="twitter:image" content="{escape(img)}">
<meta http-equiv="refresh" content="0; url={redirect}">
</head>
<body style="font-family:sans-serif;background:#FDFDFD;color:#0A0A0A;text-align:center;padding:80px">
Redirecting to your answer… <a href="{redirect}">View on yesno</a>
</body>
</html>"""
    return HTMLResponse(content=html)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
