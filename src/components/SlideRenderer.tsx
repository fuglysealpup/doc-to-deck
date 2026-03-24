'use client';

import { DeckResponse } from '@/src/types/deck';
import { useTheme } from '@/src/lib/themeContext';
import { intentLayoutMap } from '@/src/lib/intentMap';
import { themes } from '@/src/themes';

interface SlideRendererProps {
  deck: DeckResponse;
}

export default function SlideRenderer({ deck }: SlideRendererProps) {
  const { theme, setTheme } = useTheme();
  const totalSlides = deck.slides.length;

  return (
    <div className="mt-12 space-y-8">
      {/* Theme switcher */}
      <div className="flex items-center justify-center gap-2">
        {Object.values(themes).map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t)}
            className="rounded-lg px-4 py-2 text-sm font-medium transition"
            style={{
              background: theme.name === t.name ? '#1a1a1a' : '#f5f5f5',
              color: theme.name === t.name ? '#ffffff' : '#666666',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Summary card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          padding: '24px 28px',
        }}
      >
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            color: '#999',
            marginBottom: 8,
          }}
        >
          Narrative Summary
        </h2>
        <p style={{ fontSize: 15, color: '#333', lineHeight: 1.6, margin: 0 }}>
          {deck.narrative_summary}
        </p>
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            color: '#999',
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          Audience
        </h2>
        <p style={{ fontSize: 15, color: '#333', lineHeight: 1.6, margin: 0 }}>
          {deck.audience_note}
        </p>
      </div>

      {/* Slides */}
      <div className="flex flex-col gap-2.5">
        {deck.slides.map((slide) => {
          const LayoutComponent = intentLayoutMap[slide.type] || intentLayoutMap.context;
          return (
            <div
              key={slide.slide_number}
              style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
            >
              <LayoutComponent
                slide={slide}
                theme={theme}
                totalSlides={totalSlides}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
