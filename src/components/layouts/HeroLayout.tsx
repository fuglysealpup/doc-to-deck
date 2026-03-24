'use client';

import { SlideProps } from '@/src/types/deck';

export default function HeroLayout({ slide, theme, totalSlides }: SlideProps) {
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const isDark = theme.decorative.useDarkSlides;

  const headlineColor = isDark ? '#ffffff' : theme.typography.body;
  const subColor = isDark ? 'rgba(255,255,255,0.6)' : theme.typography.muted;
  const counterColor = isDark ? 'rgba(255,255,255,0.3)' : theme.typography.muted;

  return (
    <div
      style={{
        background: bg,
        fontFamily: theme.typography.fontFamily,
        aspectRatio: '16 / 9',
      }}
      className="relative w-full overflow-hidden"
    >
      {/* Decorative circles */}
      {theme.decorative.useDecoCircles && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '-15%',
              right: '-8%',
              width: '45%',
              paddingBottom: '45%',
              borderRadius: '50%',
              background: accent,
              opacity: 0.06,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-20%',
              left: '-10%',
              width: '35%',
              paddingBottom: '35%',
              borderRadius: '50%',
              background: accent,
              opacity: 0.06,
            }}
          />
        </>
      )}

      {/* Content anchored bottom left */}
      <div
        style={{ padding: '56px 64px' }}
        className="absolute bottom-0 left-0 right-0"
      >
        {/* Eyebrow */}
        <div
          style={{
            color: accent,
            marginBottom: 12,
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            fontWeight: 600,
          }}
        >
          {slide.type === 'title' ? slide.subheadline || 'Presentation' : 'Closing'}
        </div>

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
            marginBottom: 20,
          }}
        >
          {slide.type}
        </span>

        {/* Headline */}
        <h2
          style={{
            fontSize: theme.typography.headlineLg,
            color: headlineColor,
            fontWeight: 700,
            lineHeight: 1.2,
            margin: 0,
            marginBottom: 10,
          }}
        >
          {slide.headline}
        </h2>

        {/* Subheadline (only for closing) */}
        {slide.type === 'closing' && slide.subheadline && (
          <p
            style={{
              fontSize: 15,
              color: subColor,
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '70%',
            }}
          >
            {slide.subheadline}
          </p>
        )}
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          right: 64,
          fontSize: 12,
          color: counterColor,
          fontWeight: 500,
        }}
      >
        {slide.slide_number} / {totalSlides}
      </div>
    </div>
  );
}
