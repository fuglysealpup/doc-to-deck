'use client';

import { useState, useRef } from 'react';
import { DeckResponse, Slide } from '@/src/types/deck';
import { useTheme } from '@/src/lib/themeContext';
import { getLayoutForSlide, layoutComponentMap } from '@/src/lib/intentMap';
import { themes } from '@/src/themes';

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#999',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 14,
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  outline: 'none',
  color: '#333',
  fontFamily: 'inherit',
};

interface SlideRendererProps {
  deck: DeckResponse;
  onUpdateSlide: (slideNumber: number, updatedSlide: Slide) => void;
}

function EditPanel({
  slide,
  onUpdate,
  onDone,
  onCancel,
}: {
  slide: Slide;
  onUpdate: (updated: Slide) => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderLeft: '1px solid #e5e5e5',
        borderRadius: '0 10px 10px 0',
        padding: '24px 24px',
        overflowY: 'auto',
        minWidth: 0,
      }}
      className="flex flex-col gap-5"
    >
      {/* Headline */}
      <div>
        <div style={labelStyle}>Headline</div>
        <input
          type="text"
          value={slide.headline}
          onChange={(e) => onUpdate({ ...slide, headline: e.target.value })}
          style={inputStyle}
        />
      </div>

      {/* Subheadline */}
      <div>
        <div style={labelStyle}>Subheadline</div>
        <input
          type="text"
          value={slide.subheadline}
          onChange={(e) => onUpdate({ ...slide, subheadline: e.target.value })}
          style={inputStyle}
        />
      </div>

      {/* Bullets */}
      <div>
        <div style={labelStyle}>Bullets</div>
        <div className="flex flex-col gap-2">
          {slide.bullets.map((bullet, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={bullet}
                onChange={(e) => {
                  const newBullets = [...slide.bullets];
                  newBullets[i] = e.target.value;
                  onUpdate({ ...slide, bullets: newBullets });
                }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => {
                  const newBullets = slide.bullets.filter((_, j) => j !== i);
                  onUpdate({ ...slide, bullets: newBullets });
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: '1px solid #e5e5e5',
                  background: '#fafafa',
                  color: '#999',
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                title="Remove bullet"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => onUpdate({ ...slide, bullets: [...slide.bullets, ''] })}
            style={{
              fontSize: 12,
              color: '#666',
              background: '#f5f5f5',
              border: '1px dashed #ddd',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            + Add bullet
          </button>
        </div>
      </div>

      {/* Speaker note */}
      <div>
        <div style={labelStyle}>Speaker Note</div>
        <textarea
          value={slide.speaker_note}
          onChange={(e) => onUpdate({ ...slide, speaker_note: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Action buttons */}
      <div className="mt-auto flex gap-2 pt-2">
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            color: '#666',
            background: '#f5f5f5',
            border: '1px solid #e5e5e5',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onDone}
          style={{
            flex: 1,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            color: '#fff',
            background: '#1a1a1a',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function SlideRenderer({ deck, onUpdateSlide }: SlideRendererProps) {
  const { theme, setTheme } = useTheme();
  const totalSlides = deck.slides.length;
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const originalSlideRef = useRef<Slide | null>(null);

  function enterEdit(slide: Slide) {
    originalSlideRef.current = { ...slide, bullets: [...slide.bullets] };
    setEditingSlide(slide.slide_number);
  }

  function exitEdit() {
    originalSlideRef.current = null;
    setEditingSlide(null);
  }

  function cancelEdit(slideNumber: number) {
    if (originalSlideRef.current) {
      onUpdateSlide(slideNumber, originalSlideRef.current);
    }
    originalSlideRef.current = null;
    setEditingSlide(null);
  }

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
          const layoutName = getLayoutForSlide(slide);
          const LayoutComponent = layoutComponentMap[layoutName];
          const isEditing = editingSlide === slide.slide_number;

          return (
            <div
              key={slide.slide_number}
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                display: 'flex',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Slide preview */}
              <div style={{ flex: isEditing ? '0 0 58%' : '1 1 100%', position: 'relative', minWidth: 0 }}>
                <LayoutComponent
                  slide={slide}
                  theme={theme}
                  totalSlides={totalSlides}
                />
                {/* Edit button */}
                {!isEditing && (
                  <button
                    onClick={() => enterEdit(slide)}
                    title="Edit slide"
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.9)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Edit panel */}
              {isEditing && (
                <div style={{ flex: '0 0 42%', minWidth: 0 }}>
                  <EditPanel
                    slide={slide}
                    onUpdate={(updated) => onUpdateSlide(slide.slide_number, updated)}
                    onDone={exitEdit}
                    onCancel={() => cancelEdit(slide.slide_number)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
