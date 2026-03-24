'use client';

import { SlideProps } from '@/src/types/deck';
import { renderBullet } from '@/src/lib/parseBullet';

export default function SplitLayout({ slide, theme, totalSlides }: SlideProps) {
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const barWidth = parseInt(theme.decorative.accentBarWidth, 10);

  return (
    <div
      style={{
        background: bg,
        fontFamily: theme.typography.fontFamily,
        aspectRatio: '16 / 9',
      }}
      className="relative w-full overflow-hidden"
    >
      {/* Accent bar */}
      {barWidth > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: theme.decorative.accentBarWidth,
            background: accent,
          }}
        />
      )}

      <div
        style={{ padding: '44px 56px' }}
        className="flex h-full gap-12"
      >
        {/* Left column */}
        <div className="flex flex-1 flex-col justify-center">
          {/* Accent line */}
          <div
            style={{
              width: 36,
              height: 2,
              background: accent,
              marginBottom: 20,
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
              marginBottom: 10,
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
              }}
            >
              {slide.subheadline}
            </p>
          )}

          {/* Counter */}
          <div
            style={{
              fontSize: 11,
              color: theme.typography.muted,
              marginTop: 'auto',
              opacity: 0.6,
            }}
          >
            {slide.slide_number} / {totalSlides}
          </div>
        </div>

        {/* Right column — mini cards */}
        <div className="flex flex-1 flex-col justify-center gap-3">
          {slide.bullets.map((bullet, i) => (
            <div
              key={i}
              style={{
                background: theme.decorative.cardBackground,
                border: theme.decorative.cardBorder,
                borderRadius: 8,
                padding: '14px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {renderBullet(bullet, theme.typography.body, theme.typography.muted)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
