# Earnings Signal

AI-powered earnings call transcript analyzer. Paste any earnings call and get structured investment signals — overall buy/sell rating, sentiment score, key metric beats/misses, bull/bear thesis, and 5-8 categorized signals with verbatim quotes.

## Problem

Earnings calls contain hundreds of nuanced signals buried in management language. Analysts spend hours reading transcripts; retail investors rarely do. The same call can be interpreted very differently depending on what you listen for.

## Solution

Claude reads the full transcript and extracts structured signals across guidance, growth, margins, risk, sentiment, and competitive dynamics — ranked by direction (bullish/bearish) and confidence.

## Features

- **Overall signal** — STRONG_BUY / BUY / NEUTRAL / SELL / STRONG_SELL
- **Sentiment score** — continuous -1.0 to +1.0 with visual bar
- **Key metrics** — EPS beat/miss, revenue, guidance changes
- **5-8 signals** — category, direction, confidence, verbatim quote, analyst insight
- **Bull/Bear thesis** — synthesized investment cases from the call
- **Expandable signals** — click to see the quote and interpretation
- Pre-loaded example transcript to demo immediately

## Use Cases

- Individual investors reading earnings before trading
- Quant funds building NLP pipelines for signal generation
- Financial journalists summarizing calls quickly
- IR teams monitoring competitor calls

## Tech Stack

- **Backend**: FastAPI + Python + Claude
- **Frontend**: Next.js 15 + TypeScript + Tailwind

## Setup

```bash
# Backend
cp .env.example .env && pip install -r requirements.txt
uvicorn src.api:app --reload

# Frontend  
cd frontend && npm install && npm run dev
```

## License

MIT
