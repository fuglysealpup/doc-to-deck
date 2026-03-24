'use client';

import { SlideProps } from '@/src/types/deck';

export default function QuoteLayout({ slide, theme, totalSlides }: SlideProps) {
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const isDark = theme.decorative.useDarkSlides && slide.type === 'insight';

  const headlineColor = isDark ? '#ffffff' : theme.typography.body;
  const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : theme.typography.muted;
  const counterColor = isDark ? 'rgba(255,255,255,0.3)' : theme.typography.muted;

  const isProof = slide.type === 'proof';

  return (
    <div
      style={{
        background: bg,
        fontFamily: theme.typography.fontFamily,
        aspectRatio: '16 / 9',
      }}
      className="relative flex w-full items-center justify-center overflow-hidden"
    >
      {/* Decorative circles for dark insight */}
      {isDark && theme.decorative.useDecoCircles && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              right: '-5%',
              width: '40%',
              paddingBottom: '40%',
              borderRadius: '50%',
              background: accent,
              opacity: 0.06,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-15%',
              left: '-8%',
              width: '30%',
              paddingBottom: '30%',
              borderRadius: '50%',
              background: accent,
              opacity: 0.06,
            }}
          />
        </>
      )}

      <div
        style={{ padding: '56px 80px', maxWidth: '85%' }}
        className="relative text-center"
      >
        {/* Decorative quote mark for proof */}
        {isProof && (
          <div
            style={{
              fontSize: 72,
              lineHeight: 1,
              color: accent,
              opacity: 0.15,
              fontFamily: 'Georgia, serif',
              marginBottom: -16,
            }}
          >
            &ldquo;
          </div>
        )}

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
            marginBottom: 24,
          }}
        >
          {slide.type}
        </span>

        {/* Headline as quote */}
        <h2
          style={{
            fontSize: isDark ? 22 : 24,
            color: headlineColor,
            fontWeight: 500,
            lineHeight: 1.5,
            margin: 0,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: isProof ? 'italic' : 'normal',
          }}
        >
          {slide.headline}
        </h2>

        {/* Subheadline */}
        {slide.subheadline && (
          <p
            style={{
              fontSize: 14,
              color: mutedColor,
              lineHeight: 1.5,
              margin: '16px 0 0',
            }}
          >
            {slide.subheadline}
          </p>
        )}

        {/* Bullets as a subtle horizontal row */}
        {slide.bullets.length > 0 && (
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '6px 20px',
            }}
          >
            {slide.bullets.slice(0, 3).map((bullet, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  color: mutedColor,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {i > 0 && (
                  <span style={{ marginRight: 20, opacity: 0.4 }}>·</span>
                )}
                {bullet}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          right: 48,
          fontSize: 11,
          color: counterColor,
          opacity: 0.6,
        }}
      >
        {slide.slide_number} / {totalSlides}
      </div>
    </div>
  );
}
