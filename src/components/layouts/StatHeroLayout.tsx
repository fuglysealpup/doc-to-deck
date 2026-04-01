'use client';

import { SlideProps } from '@/src/types/deck';

function parseStat(bullet: string): { stat: string; label: string } | null {
  const match = bullet.match(/^(.+?)\s—\s(.+)$/);
  return match ? { stat: match[1], label: match[2] } : null;
}

export default function StatHeroLayout({ slide, theme, totalSlides }: SlideProps) {
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const stats = slide.bullets.slice(0, 3);

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
            marginBottom: 6,
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

        {/* Stat callouts */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            flex: 1,
            gap: 24,
          }}
        >
          {stats.map((bullet, i) => {
            const parsed = parseStat(bullet);
            if (parsed) {
              return (
                <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: accent,
                      lineHeight: 1.2,
                      marginBottom: 8,
                    }}
                  >
                    {parsed.stat}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.typography.muted,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.06em',
                      lineHeight: 1.4,
                    }}
                  >
                    {parsed.label}
                  </div>
                </div>
              );
            }
            return (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    color: theme.typography.body,
                    lineHeight: 1.5,
                  }}
                >
                  {bullet}
                </div>
              </div>
            );
          })}
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
