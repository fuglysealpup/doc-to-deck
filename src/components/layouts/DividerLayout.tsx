'use client';

import { SlideProps } from '@/src/types/deck';

export default function DividerLayout({ slide, theme, totalSlides }: SlideProps) {
  const accent = theme.accents[slide.type];

  // Build a bold gradient from the accent color
  const h = accent.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  // Darken for the gradient end
  const dr = Math.max(0, Math.round(r * 0.6));
  const dg = Math.max(0, Math.round(g * 0.6));
  const db = Math.max(0, Math.round(b * 0.6));
  const gradientBg = `linear-gradient(135deg, rgb(${r},${g},${b}) 0%, rgb(${dr},${dg},${db}) 100%)`;

  return (
    <div
      style={{
        background: gradientBg,
        fontFamily: theme.typography.fontFamily,
        aspectRatio: '16 / 9',
      }}
      className="relative flex w-full items-center justify-center overflow-hidden"
    >
      {/* Subtle geometric decoration */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40%',
          height: '100%',
          background: 'rgba(255,255,255,0.04)',
          clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{ padding: '56px 80px', maxWidth: '80%' }}
        className="relative text-center"
      >
        {/* Thin rule above headline */}
        <div
          style={{
            width: 40,
            height: 2,
            background: 'rgba(255,255,255,0.4)',
            margin: '0 auto 28px',
          }}
        />

        {/* Headline */}
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.3,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {slide.headline}
        </h2>

        {/* Subheadline */}
        {slide.subheadline && (
          <p
            style={{
              fontSize: 15,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.5,
              margin: '14px 0 0',
            }}
          >
            {slide.subheadline}
          </p>
        )}

        {/* Thin rule below */}
        <div
          style={{
            width: 40,
            height: 2,
            background: 'rgba(255,255,255,0.4)',
            margin: '28px auto 0',
          }}
        />
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          right: 40,
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          fontWeight: 500,
        }}
      >
        {slide.slide_number} / {totalSlides}
      </div>
    </div>
  );
}
