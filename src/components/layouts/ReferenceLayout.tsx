'use client';

import { SlideProps } from '@/src/types/deck';

export default function ReferenceLayout({ slide, theme, totalSlides }: SlideProps) {
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];

  return (
    <div
      style={{
        background: bg,
        fontFamily: theme.typography.fontFamily,
        aspectRatio: '16 / 9',
      }}
      className="relative w-full overflow-hidden"
    >
      <div
        style={{ padding: '44px 56px' }}
        className="flex h-full flex-col"
      >
        {/* Eyebrow */}
        <div
          style={{
            color: theme.typography.muted,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          {slide.type}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 36,
            height: 2,
            background: accent,
            marginBottom: 16,
          }}
        />

        {/* Badge */}
        <span
          style={{
            background: badge.background,
            color: badge.color,
            fontSize: 10,
            padding: '3px 10px',
            borderRadius: 20,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            display: 'inline-block',
            marginBottom: 16,
            alignSelf: 'flex-start',
          }}
        >
          {slide.type}
        </span>

        {/* Headline */}
        <h2
          style={{
            fontSize: theme.typography.headlineMd,
            color: theme.typography.body,
            fontWeight: 700,
            lineHeight: 1.3,
            margin: 0,
            marginBottom: 24,
          }}
        >
          {slide.headline}
        </h2>

        {/* Reference items */}
        <div className="flex flex-1 flex-col justify-center gap-0">
          {slide.bullets.map((bullet, i) => (
            <div
              key={i}
              style={{
                padding: '12px 0 12px 16px',
                borderLeft: `2px solid ${accent}`,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: theme.typography.body,
                  lineHeight: 1.5,
                }}
              >
                {bullet}
              </div>
            </div>
          ))}
        </div>

        {/* Counter */}
        <div
          style={{
            fontSize: 11,
            color: theme.typography.muted,
            textAlign: 'right' as const,
            opacity: 0.6,
            marginTop: 8,
          }}
        >
          {slide.slide_number} / {totalSlides}
        </div>
      </div>
    </div>
  );
}
