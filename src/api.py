from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.analyzer import analyze_transcript
from typing import Optional, List
import traceback

app = FastAPI(title="Earnings Signal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    transcript: str
    ticker: Optional[str] = ""
    company: Optional[str] = ""


class SignalOut(BaseModel):
    category: str
    direction: str
    confidence: str
    quote: str
    insight: str


class MetricsOut(BaseModel):
    eps_beat: Optional[bool]
    eps_actual: Optional[str]
    eps_estimate: Optional[str]
    revenue_beat: Optional[bool]
    revenue_actual: Optional[str]
    guidance_raised: Optional[bool]
    guidance_note: Optional[str]


class AnalysisResponse(BaseModel):
    company: str
    ticker: str
    quarter: str
    overall_signal: str
    sentiment_score: float
    key_metrics: dict
    signals: List[SignalOut]
    bull_thesis: str
    bear_thesis: str
    summary: str


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(req: AnalyzeRequest):
    if len(req.transcript) > 100_000:
        raise HTTPException(status_code=400, detail="Transcript too large (max 100KB)")
    try:
        result = analyze_transcript(req.transcript, req.ticker or "", req.company or "")
        return AnalysisResponse(
            company=result.company,
            ticker=result.ticker,
            quarter=result.quarter,
            overall_signal=result.overall_signal,
            sentiment_score=result.sentiment_score,
            key_metrics=result.key_metrics,
            signals=[
                SignalOut(
                    category=s.category,
                    direction=s.direction,
                    confidence=s.confidence,
                    quote=s.quote,
                    insight=s.insight,
                )
                for s in result.signals
            ],
            bull_thesis=result.bull_thesis,
            bear_thesis=result.bear_thesis,
            summary=result.summary,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
