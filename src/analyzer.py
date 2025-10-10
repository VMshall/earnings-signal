import os
import re
import json
import anthropic
from dataclasses import dataclass
from typing import List, Optional

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


@dataclass
class Signal:
    category: str        # guidance, growth, margin, risk, sentiment
    direction: str       # bullish | bearish | neutral
    confidence: str      # high | medium | low
    quote: str           # verbatim excerpt
    insight: str         # analyst interpretation


@dataclass
class EarningsAnalysis:
    company: str
    ticker: str
    quarter: str
    overall_signal: str          # STRONG_BUY | BUY | NEUTRAL | SELL | STRONG_SELL
    sentiment_score: float       # -1.0 to 1.0
    key_metrics: dict            # EPS beat/miss, revenue, guidance
    signals: List[Signal]
    bull_thesis: str
    bear_thesis: str
    summary: str


def analyze_transcript(transcript: str, ticker: str = "", company: str = "") -> EarningsAnalysis:
    if len(transcript.strip()) < 200:
        raise ValueError("Transcript too short — paste the full earnings call text.")

    # Truncate to ~12k chars for context efficiency
    text = transcript[:12000]

    prompt = f"""You are a top-tier equity research analyst. Analyze this earnings call transcript and extract structured investment signals.

Company: {company or "Unknown"} ({ticker or "Unknown"})

TRANSCRIPT:
{text}

Respond ONLY with a valid JSON object in this schema:
{{
  "company": "string",
  "ticker": "string (inferred if not provided)",
  "quarter": "string (e.g. Q3 2024)",
  "overall_signal": "STRONG_BUY|BUY|NEUTRAL|SELL|STRONG_SELL",
  "sentiment_score": float (-1.0 to 1.0),
  "key_metrics": {{
    "eps_beat": boolean or null,
    "eps_actual": "string or null",
    "eps_estimate": "string or null",
    "revenue_beat": boolean or null,
    "revenue_actual": "string or null",
    "guidance_raised": boolean or null,
    "guidance_note": "string or null"
  }},
  "signals": [
    {{
      "category": "guidance|growth|margin|risk|sentiment|competition",
      "direction": "bullish|bearish|neutral",
      "confidence": "high|medium|low",
      "quote": "verbatim 1-2 sentence excerpt from transcript",
      "insight": "analyst interpretation of this signal"
    }}
  ],
  "bull_thesis": "string (2-3 sentences: strongest bull case from this call)",
  "bear_thesis": "string (2-3 sentences: key risks and bear case)",
  "summary": "string (3-4 sentences: what happened, what surprised, what matters for the stock)"
}}

Extract 5-8 signals. Focus on:
- Forward guidance changes (raised/lowered/maintained)
- Margin trajectory (expansion/compression)
- New products/markets called out
- Competitive positioning language
- Management tone shifts (cautious vs. confident)
- Unexpected items (one-time charges, writedowns)
- Customer concentration or churn signals

Only JSON, no markdown."""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)

    data = json.loads(raw)

    signals = [
        Signal(
            category=s["category"],
            direction=s["direction"],
            confidence=s["confidence"],
            quote=s["quote"],
            insight=s["insight"],
        )
        for s in data.get("signals", [])
    ]

    return EarningsAnalysis(
        company=data.get("company", company),
        ticker=data.get("ticker", ticker).upper(),
        quarter=data.get("quarter", ""),
        overall_signal=data.get("overall_signal", "NEUTRAL"),
        sentiment_score=float(data.get("sentiment_score", 0)),
        key_metrics=data.get("key_metrics", {}),
        signals=signals,
        bull_thesis=data.get("bull_thesis", ""),
        bear_thesis=data.get("bear_thesis", ""),
        summary=data.get("summary", ""),
    )
