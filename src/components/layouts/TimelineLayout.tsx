'use client';

import { SlideProps } from '@/src/types/deck';
import { renderBullet } from '@/src/lib/parseBullet';

function parseTimeLabel(bullet: string): { label: string; text: string } {
  // Match patterns like "Near term:", "Q1 2026 -", "Now:", "Month 1-3:", "2026:"
  const match = bullet.match(
    /^((?:Near|Mid|Long)\s+term|Now|Q[1-4]\s*\d{0,4}|20\d{2}|Phase\s+\d+|Month\s+[\d–-]+)[:\s–-]+\s*(.*)/i
  );
  if (match) {
    return { label: match[1].trim(), text: match[2].trim() };
  }
  return { label: '', text: bullet };
}

export default function TimelineLayout({ slide, theme, totalSlides }: SlideProps) {
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  // Extract border color from cardBorder string
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
            marginBottom: 20,
          }}
        >
          {slide.headline}
        </h2>

        {/* Timeline rows */}
        <div className="flex flex-1 flex-col justify-center">
          {slide.bullets.map((bullet, i) => {
            const { label, text } = parseTimeLabel(bullet);
            const displayLabel = label || `Phase ${i + 1}`;
            const isLast = i === slide.bullets.length - 1;

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: isLast ? 'none' : `0.5px solid ${borderColor}`,
                  alignItems: 'baseline',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: accent,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.04em',
                    minWidth: 90,
                    flexShrink: 0,
                  }}
                >
                  {displayLabel}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {renderBullet(text, theme.typography.body, theme.typography.muted)}
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
