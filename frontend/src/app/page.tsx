"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart2, ChevronDown, ChevronUp } from "lucide-react";

interface Signal {
  category: string;
  direction: "bullish" | "bearish" | "neutral";
  confidence: "high" | "medium" | "low";
  quote: string;
  insight: string;
}

interface AnalysisResult {
  company: string;
  ticker: string;
  quarter: string;
  overall_signal: string;
  sentiment_score: number;
  key_metrics: {
    eps_beat?: boolean | null;
    eps_actual?: string | null;
    eps_estimate?: string | null;
    revenue_beat?: boolean | null;
    revenue_actual?: string | null;
    guidance_raised?: boolean | null;
    guidance_note?: string | null;
  };
  signals: Signal[];
  bull_thesis: string;
  bear_thesis: string;
  summary: string;
}

const EXAMPLE_TRANSCRIPT = `Good afternoon, and thank you for joining us. I'm pleased to report that we delivered another strong quarter.

Revenue came in at $24.3 billion, up 18% year-over-year, beating consensus estimates of $23.1 billion. Earnings per share of $2.47 exceeded expectations of $2.21, representing a 12% beat.

Our cloud segment continues to accelerate — cloud revenue grew 34% to $8.2 billion. We're seeing strong adoption across enterprise customers, with net new ARR of $1.4 billion this quarter, up from $1.1 billion last quarter.

Operating margins expanded 180 basis points to 28.4%, driven by our ongoing efficiency initiatives. We've reduced headcount by 3% while increasing output — we're doing more with less.

However, I want to be transparent about some headwinds. Our consumer hardware segment saw revenue decline 8% due to softer demand and inventory corrections. We expect this to persist through Q1 next year.

On guidance: we are raising full-year revenue guidance to $94-96 billion from our previous $90-92 billion range. We now expect operating margins of 27-28% for the full year, up from 25-26%.

We've made significant progress on our AI product line. Our new AI assistant has 12 million monthly active users, up from 3 million last quarter. Enterprise deals in AI tooling doubled sequentially.

Competition remains fierce. Our primary competitor announced a major product refresh last week, and we're monitoring customer response carefully. We believe our differentiation in security and compliance will be decisive for enterprise deals.

Thank you, and we'll now take questions.`;

const SIGNAL_COLORS = {
  bullish: "bg-emerald-900/40 border-emerald-700 text-emerald-300",
  bearish: "bg-red-900/40 border-red-700 text-red-300",
  neutral: "bg-gray-800/40 border-gray-600 text-gray-300",
};

const DIRECTION_ICON = {
  bullish: <TrendingUp size={14} className="text-emerald-400" />,
  bearish: <TrendingDown size={14} className="text-red-400" />,
  neutral: <Minus size={14} className="text-gray-400" />,
};

const SIGNAL_LABELS = {
  STRONG_BUY: { label: "STRONG BUY", color: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-700" },
  BUY: { label: "BUY", color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800" },
  NEUTRAL: { label: "NEUTRAL", color: "text-gray-400", bg: "bg-gray-800/30 border-gray-700" },
  SELL: { label: "SELL", color: "text-red-400", bg: "bg-red-900/20 border-red-800" },
  STRONG_SELL: { label: "STRONG SELL", color: "text-red-400", bg: "bg-red-900/30 border-red-700" },
};

const CONFIDENCE_DOT = {
  high: "bg-emerald-400",
  medium: "bg-yellow-400",
  low: "bg-gray-400",
};

function MetricBadge({ label, value, positive }: { label: string; value: string | null | undefined; positive?: boolean | null }) {
  if (value == null && positive == null) return null;
  const color = positive === true ? "text-emerald-400" : positive === false ? "text-red-400" : "text-gray-300";
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`font-semibold text-sm ${color}`}>{value ?? (positive ? "Beat" : "Miss")}</div>
    </div>
  );
}

export default function Home() {
  const [transcript, setTranscript] = useState(EXAMPLE_TRANSCRIPT);
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, ticker }),
        }
      );
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(e.detail);
      }
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const signalInfo = result ? (SIGNAL_LABELS[result.overall_signal as keyof typeof SIGNAL_LABELS] ?? SIGNAL_LABELS.NEUTRAL) : null;
  const sentimentPct = result ? ((result.sentiment_score + 1) / 2) * 100 : 50;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <BarChart2 className="text-blue-400" size={22} />
          <h1 className="text-xl font-semibold tracking-tight">Earnings Signal</h1>
          <span className="text-xs text-gray-500 ml-auto">powered by Claude</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Earnings Call Transcript</h2>
              <p className="text-gray-400 text-sm">
                Paste an earnings call transcript to extract structured investment signals.
              </p>
            </div>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Ticker (optional, e.g. AAPL)"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full h-80 bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Paste earnings call transcript here…"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !transcript.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              <BarChart2 size={16} />
              {loading ? "Analyzing…" : "Extract Signals"}
            </button>
            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 text-red-300 text-sm">{error}</div>
            )}
          </div>

          {/* Results */}
          <div>
            {loading && (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-400 border-t-transparent mb-4" />
                <p>Reading transcript and extracting signals…</p>
              </div>
            )}

            {result && signalInfo && (
              <div className="space-y-4">
                {/* Header */}
                <div className={`border rounded-xl p-5 ${signalInfo.bg}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs text-gray-500">{result.quarter}</div>
                      <div className="text-2xl font-bold">{result.ticker}</div>
                      <div className="text-gray-400 text-sm">{result.company}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${signalInfo.color}`}>{signalInfo.label}</div>
                      <div className="text-xs text-gray-500 mt-1">overall signal</div>
                    </div>
                  </div>

                  {/* Sentiment bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Bearish</span>
                      <span>Sentiment: {result.sentiment_score > 0 ? "+" : ""}{result.sentiment_score.toFixed(2)}</span>
                      <span>Bullish</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${result.sentiment_score > 0.3 ? "bg-emerald-500" : result.sentiment_score < -0.3 ? "bg-red-500" : "bg-yellow-500"}`}
                        style={{ width: `${sentimentPct}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-2">
                  {result.key_metrics.eps_actual && (
                    <MetricBadge label="EPS" value={result.key_metrics.eps_actual} positive={result.key_metrics.eps_beat} />
                  )}
                  {result.key_metrics.revenue_actual && (
                    <MetricBadge label="Revenue" value={result.key_metrics.revenue_actual} positive={result.key_metrics.revenue_beat} />
                  )}
                  {result.key_metrics.guidance_note && (
                    <div className="col-span-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
                      <div className="text-xs text-gray-500">Guidance</div>
                      <div className={`text-sm font-medium ${result.key_metrics.guidance_raised ? "text-emerald-400" : result.key_metrics.guidance_raised === false ? "text-red-400" : "text-gray-300"}`}>
                        {result.key_metrics.guidance_raised ? "↑ " : result.key_metrics.guidance_raised === false ? "↓ " : ""}
                        {result.key_metrics.guidance_note}
                      </div>
                    </div>
                  )}
                </div>

                {/* Signals */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {result.signals.map((s, i) => (
                    <div
                      key={i}
                      className={`border rounded-lg overflow-hidden cursor-pointer ${SIGNAL_COLORS[s.direction]}`}
                      onClick={() => setExpandedSignal(expandedSignal === i ? null : i)}
                    >
                      <div className="flex items-center gap-2 p-3">
                        {DIRECTION_ICON[s.direction]}
                        <span className="text-xs font-semibold uppercase tracking-wider">{s.category}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <div className={`w-1.5 h-1.5 rounded-full ${CONFIDENCE_DOT[s.confidence]}`} />
                          <span className="text-xs opacity-60">{s.confidence}</span>
                        </div>
                        {expandedSignal === i ? <ChevronUp size={14} className="opacity-60" /> : <ChevronDown size={14} className="opacity-60" />}
                      </div>
                      {expandedSignal === i && (
                        <div className="px-3 pb-3 space-y-2 border-t border-current border-opacity-20">
                          <blockquote className="text-xs italic opacity-80 mt-2">"{s.quote}"</blockquote>
                          <p className="text-xs leading-relaxed">{s.insight}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bull / Bear */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={13} className="text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400 uppercase">Bull Thesis</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{result.bull_thesis}</p>
                  </div>
                  <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingDown size={13} className="text-red-400" />
                      <span className="text-xs font-semibold text-red-400 uppercase">Bear Thesis</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{result.bear_thesis}</p>
                  </div>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-600">
                <BarChart2 size={40} className="mb-4 opacity-30" />
                <p className="text-sm">Signals will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
