"use client";

import { useCallback, useState } from "react";
import { DeckResponse, Slide } from "@/src/types/deck";
import SlideRenderer from "@/src/components/SlideRenderer";

export default function Home() {
  const [doc, setDoc] = useState("");
  const [result, setResult] = useState<DeckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function handleGenerate() {
    if (!doc.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
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
        {result && <SlideRenderer deck={result} onUpdateSlide={updateSlide} />}
      </div>
    </main>
  );
}
