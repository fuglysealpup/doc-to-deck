"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DeckResponse, Slide } from "@/src/types/deck";
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
  const { theme } = useTheme();
  const didAutoExport = useRef(false);

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

  async function doExport(deck: DeckResponse) {
    setExportStatus("exporting");
    setExportError("");

    try {
      const res = await fetch("/api/export/google-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deck.slides[0]?.headline || "Untitled Deck",
          slides: deck.slides,
          theme: theme.name.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        // Not authenticated or token expired — start OAuth
        sessionStorage.setItem("deck_for_export", JSON.stringify(deck));
        sessionStorage.setItem("theme_for_export", theme.name.toLowerCase());
        window.location.href = "/api/auth/google";
        return;
      }

      if (!res.ok) {
        setExportStatus("error");
        setExportError(data.error || "Export failed.");
        return;
      }

      setExportStatus("success");
      window.open(data.url, "_blank");
      setTimeout(() => setExportStatus("idle"), 3000);
    } catch {
      setExportStatus("error");
      setExportError("Failed to connect to the server.");
    }
  }

  // Handle OAuth redirect back
  useEffect(() => {
    if (didAutoExport.current) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("google_auth") === "success") {
      window.history.replaceState({}, "", "/");

      const savedDeck = sessionStorage.getItem("deck_for_export");
      if (savedDeck) {
        didAutoExport.current = true;
        const deck: DeckResponse = JSON.parse(savedDeck);
        setResult(deck);
        sessionStorage.removeItem("deck_for_export");
        sessionStorage.removeItem("theme_for_export");
        doExport(deck);
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
        body: JSON.stringify({ doc, audience, desiredOutcome }),
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
          body: JSON.stringify({ slides: deckData.slides }),
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
              <button
                onClick={() => doExport(result)}
                disabled={exportStatus === "exporting"}
                className="inline-flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exportStatus === "exporting" ? (
                  <>
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
                    Exporting...
                  </>
                ) : exportStatus === "success" ? (
                  <>
                    <svg
                      className="h-4 w-4 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Opened in Google Slides
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8" />
                      <path d="M12 17v4" />
                    </svg>
                    Export to Google Slides
                  </>
                )}
              </button>
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
