'use client';

import { SlideProps } from '@/src/types/deck';

function parseRow(bullet: string): { left: string; right: string } | null {
  const match = bullet.match(/^(.+?)\s—\s(.+)$/);
  return match ? { left: match[1], right: match[2] } : null;
}

export default function TableLayout({ slide, theme, totalSlides }: SlideProps) {
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const borderColor = theme.decorative.cardBorder.replace(/^[\d.]+px\s+solid\s+/, '');

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
              marginBottom: 16,
            }}
          >
            {slide.subheadline}
          </p>
        )}

        {/* Table rows */}
        <div className="flex flex-1 flex-col justify-center">
          {slide.bullets.map((bullet, i) => {
            const parsed = parseRow(bullet);
            const isFirst = i === 0;
            const isLast = i === slide.bullets.length - 1;

            if (parsed) {
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    padding: '10px 0',
                    borderBottom: isLast ? 'none' : `0.5px solid ${borderColor}`,
                    alignItems: 'baseline',
                  }}
                >
                  <div
                    style={{
                      width: '30%',
                      flexShrink: 0,
                      fontSize: 13,
                      fontWeight: isFirst ? 700 : 600,
                      color: theme.typography.body,
                      paddingRight: 16,
                    }}
                  >
                    {parsed.left}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 400,
                      color: theme.typography.muted,
                      lineHeight: 1.5,
                    }}
                  >
                    {parsed.right}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                style={{
                  padding: '10px 0',
                  borderBottom: isLast ? 'none' : `0.5px solid ${borderColor}`,
                  fontSize: 13,
                  color: theme.typography.body,
                  lineHeight: 1.5,
                }}
              >
                {bullet}
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
