"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DeckResponse, Slide, SlideLayout } from "@/src/types/deck";
import SlideRenderer from "@/src/components/SlideRenderer";
import { useTheme } from "@/src/lib/themeContext";

type ExportStatus = "idle" | "exporting" | "success" | "error";

export default function Home() {
  const [doc, setDoc] = useState("");
  const [audience, setAudience] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [result, setResult] = useState<DeckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [exportError, setExportError] = useState("");
  const [exportUrl, setExportUrl] = useState("");
  const [model, setModel] = useState<"claude" | "opus" | "openai">("claude");
  const { theme } = useTheme();
  const didAutoExport = useRef(false);
  const isExporting = useRef(false);

  const updateSlide = useCallback(
    (slideNumber: number, updatedSlide: Slide) => {
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          slides: prev.slides.map((s) =>
            s.slide_number === slideNumber ? updatedSlide : s
          ),
        };
      });
    },
    []
  );

  async function doExport(deck: DeckResponse, overrideTheme?: string) {
    if (isExporting.current) return;
    isExporting.current = true;
    setExportStatus("exporting");
    setExportError("");
    setExportUrl("");

    const themeName = overrideTheme ?? theme.name.toLowerCase();

    try {
      const res = await fetch("/api/export/google-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deck.slides[0]?.headline || "Untitled Deck",
          slides: deck.slides,
          theme: themeName,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        isExporting.current = false;
        sessionStorage.setItem("deck_for_export", JSON.stringify(deck));
        sessionStorage.setItem("theme_for_export", themeName);
        window.location.href = "/api/auth/google";
        return;
      }

      if (!res.ok) {
        setExportStatus("error");
        setExportError(data.error || "Export failed.");
        isExporting.current = false;
        return;
      }

      setExportStatus("success");
      setExportUrl(data.url);
      window.open(data.url, "_blank");
      setTimeout(() => { setExportStatus("idle"); isExporting.current = false; }, 5000);
    } catch {
      setExportStatus("error");
      setExportError("Failed to connect to the server.");
      isExporting.current = false;
    }
  }

  // Handle OAuth redirect back
  useEffect(() => {
    if (didAutoExport.current) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("google_auth") === "success") {
      window.history.replaceState({}, "", "/");

      const savedDeck = sessionStorage.getItem("deck_for_export");
      const savedTheme = sessionStorage.getItem("theme_for_export");
      if (savedDeck) {
        didAutoExport.current = true;
        const deck: DeckResponse = JSON.parse(savedDeck);
        setResult(deck);
        setExportStatus("exporting");
        setTimeout(async () => {
          await doExport(deck, savedTheme || undefined);
          sessionStorage.removeItem("deck_for_export");
          sessionStorage.removeItem("theme_for_export");
        }, 1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    if (!doc.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    let deckData: DeckResponse | null = null;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc, audience, desiredOutcome, model }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        deckData = data;
        setResult(data);
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }

    // Phase 2: Layout assignment (non-blocking)
    if (deckData) {
      try {
        const layoutRes = await fetch("/api/assign-layouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slides: deckData.slides, model }),
        });
        if (layoutRes.ok) {
          const { layouts } = await layoutRes.json();
          const updatedSlides = deckData.slides.map((slide: Slide) => {
            const assignment = layouts.find(
              (l: { slide_number: number; layout: string }) =>
                l.slide_number === slide.slide_number
            );
            return assignment ? { ...slide, layout: assignment.layout } : slide;
          });
          setResult({ ...deckData, slides: updatedSlides });
        }
      } catch (err) {
        console.error("Layout assignment failed, using defaults:", err);
      }
    }
  }

  return (
    <main className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            doc-to-deck
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Paste a document. Get a structured slide deck narrative.
          </p>
        </div>

        {/* Input */}
        <textarea
          value={doc}
          onChange={(e) => setDoc(e.target.value)}
          placeholder="Paste your document content here..."
          rows={12}
          className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 text-base text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        {/* Audience & outcome fields */}
        <div className="mt-4 flex gap-4">
          <div className="flex-1">
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.08em",
                color: "#999",
                display: "block",
                marginBottom: 6,
              }}
            >
              Who is this for?
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder='e.g., "TNC executives," "investors," "my engineering team"'
              className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-base text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          <div className="flex-1">
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.08em",
                color: "#999",
                display: "block",
                marginBottom: 6,
              }}
            >
              What should they do after?
            </label>
            <input
              type="text"
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              placeholder='e.g., "approve next steps," "invest," "understand the findings"'
              className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-base text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        {/* Model selector */}
        <div className="mt-4 flex items-center gap-3">
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999" }}>
            Model
          </span>
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#f5f5f5" }}>
            <button
              onClick={() => setModel("claude")}
              style={{
                padding: "5px 12px", fontSize: 12, fontWeight: 500, borderRadius: 6, border: "none", cursor: "pointer",
                background: model === "claude" ? "#1a1a1a" : "transparent",
                color: model === "claude" ? "#ffffff" : "#666666",
                transition: "all 0.15s ease",
              }}
            >
              Claude Sonnet 4.6
            </button>
            <button
              onClick={() => setModel("opus")}
              style={{
                padding: "5px 12px", fontSize: 12, fontWeight: 500, borderRadius: 6, border: "none", cursor: "pointer",
                background: model === "opus" ? "#1a1a1a" : "transparent",
                color: model === "opus" ? "#ffffff" : "#666666",
                transition: "all 0.15s ease",
              }}
            >
              Claude Opus 4.6
            </button>
            <button
              onClick={() => setModel("openai")}
              style={{
                padding: "5px 12px", fontSize: 12, fontWeight: 500, borderRadius: 6, border: "none", cursor: "pointer",
                background: model === "openai" ? "#1a1a1a" : "transparent",
                color: model === "openai" ? "#ffffff" : "#666666",
                transition: "all 0.15s ease",
              }}
            >
              GPT-5.4
            </button>
          </div>
          {model === "openai" && (
            <span style={{ fontSize: 11, color: "#999" }}>experimental</span>
          )}
          {model === "opus" && (
            <span style={{ fontSize: 11, color: "#999" }}>slower &middot; higher cost</span>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !doc.trim()}
          className="mt-4 w-full rounded-xl bg-gray-900 px-6 py-3.5 text-base font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            "Generate deck"
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <SlideRenderer deck={result} onUpdateSlide={updateSlide} />

            {/* Export button */}
            <div className="mt-8 flex flex-col items-center gap-2">
              {exportStatus === "success" && exportUrl ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-700">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Deck ready
                  </div>
                  <a
                    href={exportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-800 transition"
                  >
                    Open in Google Slides &rarr;
                  </a>
                </>
              ) : (
                <button
                  onClick={() => doExport(result)}
                  disabled={exportStatus === "exporting"}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exportStatus === "exporting" ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8" />
                        <path d="M12 17v4" />
                      </svg>
                      Export to Google Slides
                    </>
                  )}
                </button>
              )}
              {exportStatus === "error" && exportError && (
                <p className="text-xs text-red-600">{exportError}</p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
