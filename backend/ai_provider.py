"""AI provider abstraction for yesno.

Providers are pluggable: the initial implementation uses Claude (Sonnet 4.6)
via the Emergent universal LLM key, but new providers can be added by
subclassing AIProvider and returning the same structured schema.
"""
import json
import os
import re
import uuid
from abc import ABC, abstractmethod

from emergentintegrations.llm.chat import LlmChat, UserMessage

SYSTEM_PROMPT = """You are the reasoning engine for "yesno", a product that reduces any question to a clear YES or NO.

Analyze the user's question and respond with ONLY a valid JSON object (no markdown fences, no prose) matching this EXACT schema:
{
  "answer": "YES" | "NO",
  "yesProbability": <integer 0-100>,
  "noProbability": <integer 0-100>,
  "certainty": "DEFINITE_YES" | "DEFINITE_NO" | "PROBABILISTIC" | "SUBJECTIVE" | "TIME_SENSITIVE" | "INSUFFICIENT_INFORMATION",
  "confidence": "high" | "medium" | "low",
  "shortAnswer": "<one concise sentence stating the answer>",
  "reason": "<2 to 4 sentence explanation of the reasoning>",
  "evidence": ["<short point>", "<short point>", "<short point>"],
  "sources": [ {"title": "", "publisher": "", "url": "", "date": "", "description": ""} ]
}

Rules:
- yesProbability + noProbability MUST total exactly 100.
- "answer" is "YES" when yesProbability >= 50, otherwise "NO".
- For clear verifiable facts (e.g. "Is Paris the capital of France?", "Is 2+2 equal to 5?") use DEFINITE_YES or DEFINITE_NO, confidence "high", and probabilities of 100/0 or 0/100.
- For predictions or uncertain questions use PROBABILISTIC with a calibrated probability and confidence "medium" or "low".
- For subjective questions choose the most defensible interpretation, use SUBJECTIVE, and let the probability reflect the uncertainty.
- For questions that depend on current information you may not have, use TIME_SENSITIVE and lower the confidence.
- For high-stakes questions (medical diagnosis, legal outcomes, financial guarantees, dangerous activities), never imply certainty: keep confidence "low" or "medium" and in "reason" recommend consulting a qualified professional.
- evidence: 2 to 5 short, readable points. No citations inside them.
- sources: Do NOT invent sources or URLs. Only include a source if you are highly confident it genuinely exists and is relevant (e.g. a well-known primary source or official documentation). If you are not certain, return an empty array [].
- Tone: clear, neutral, helpful. Never make "maybe" the main answer.

Respond with the JSON object ONLY."""


class AIProvider(ABC):
    """Base class for all yesno answer providers."""

    @abstractmethod
    async def answer(self, question: str) -> dict:
        """Return a raw structured dict for the given question."""
        raise NotImplementedError


class ClaudeProvider(AIProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        self.api_key = api_key
        self.provider = "anthropic"
        self.model = model

    async def answer(self, question: str) -> dict:
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"yesno-{uuid.uuid4()}",
            system_message=SYSTEM_PROMPT,
        ).with_model(self.provider, self.model)

        response = await chat.send_message(UserMessage(text=question.strip()))
        return _extract_json(str(response))


def _extract_json(text: str) -> dict:
    """Extract the first JSON object from a model response, tolerant of fences."""
    cleaned = text.strip()
    # Strip markdown code fences if present.
    fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1)
    else:
        brace = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if brace:
            cleaned = brace.group(0)
    return json.loads(cleaned)


def get_provider() -> AIProvider:
    """Factory: swap this to change the active provider."""
    api_key = os.environ["EMERGENT_LLM_KEY"]
    return ClaudeProvider(api_key=api_key)
