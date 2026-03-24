'use client';

import { SlideProps } from '@/src/types/deck';
import { renderBullet } from '@/src/lib/parseBullet';

export default function ListLayout({ slide, theme, totalSlides }: SlideProps) {
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
            marginBottom: 8,
          }}
        >
          {slide.headline}
        </h2>

        {/* Subheadline */}
        {slide.subheadline && (
          <p
            style={{
              fontSize: 14,
              color: theme.typography.muted,
              lineHeight: 1.5,
              margin: 0,
              marginBottom: 24,
            }}
          >
            {slide.subheadline}
          </p>
        )}

        {/* Bullet list */}
        <div className="flex flex-1 flex-col justify-center gap-4">
          {slide.bullets.map((bullet, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: accent,
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {renderBullet(bullet, theme.typography.body, theme.typography.muted)}
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
