'use client';

import { SlideProps } from '@/src/types/deck';

function parseBullets(bullets: string[]): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  for (const b of bullets) {
    const trimmed = b.trim();
    if (/^CON:\s*/i.test(trimmed)) {
      cons.push(trimmed.replace(/^CON:\s*/i, ''));
    } else if (/^PRO:\s*/i.test(trimmed)) {
      pros.push(trimmed.replace(/^PRO:\s*/i, ''));
    } else {
      pros.push(trimmed);
    }
  }
  return { pros, cons };
}

export default function ProConLayout({ slide, theme, totalSlides }: SlideProps) {
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const { pros, cons } = parseBullets(slide.bullets);

  // Muted, professional greens and reds
  const proColor = '#1a7a4c';
  const proBg = 'rgba(26, 122, 76, 0.05)';
  const proBorder = 'rgba(26, 122, 76, 0.12)';
  const conColor = '#b45309';
  const conBg = 'rgba(180, 83, 9, 0.05)';
  const conBorder = 'rgba(180, 83, 9, 0.12)';

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
        style={{ padding: '36px 48px' }}
        className="flex h-full flex-col"
      >
        {/* Accent line */}
        <div
          style={{
            width: 36,
            height: 2,
            background: accent,
            marginBottom: 12,
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
            marginBottom: 12,
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
            marginBottom: 4,
          }}
        >
          {slide.headline}
        </h2>

        {/* Subheadline */}
        {slide.subheadline && (
          <p
            style={{
              fontSize: 13,
              color: theme.typography.muted,
              lineHeight: 1.5,
              margin: 0,
              marginBottom: 8,
            }}
          >
            {slide.subheadline}
          </p>
        )}

        {/* Two columns */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            flex: 1,
            marginTop: 12,
            minHeight: 0,
          }}
        >
          {/* Pros column */}
          <div
            style={{
              flex: 1,
              background: proBg,
              border: `1px solid ${proBorder}`,
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: proColor,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              Benefits
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pros.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <circle cx="12" cy="12" r="10" fill={proBorder} />
                    <path
                      d="M8 12l2.5 2.5L16 9.5"
                      stroke={proColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: 12,
                      color: theme.typography.body,
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cons column */}
          <div
            style={{
              flex: 1,
              background: conBg,
              border: `1px solid ${conBorder}`,
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: conColor,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              Challenges
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cons.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <circle cx="12" cy="12" r="10" fill={conBorder} />
                    <path
                      d="M12 8v5M12 15.5v.5"
                      stroke={conColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: 12,
                      color: theme.typography.body,
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
