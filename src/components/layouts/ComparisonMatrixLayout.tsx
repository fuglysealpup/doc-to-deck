'use client';

import { SlideProps } from '@/src/types/deck';

function parseHeaders(bullet: string): string[] {
  return bullet.split('|').map((s) => s.trim()).filter(Boolean);
}

function parseRow(bullet: string): { entity: string; cells: string[] } {
  const parts = bullet.split('|').map((s) => s.trim());
  return { entity: parts[0] || '', cells: parts.slice(1) };
}

function isPositive(val: string): boolean {
  const v = val.trim().toLowerCase();
  return v === '✓' || v === 'yes' || v === 'true';
}

function isNegative(val: string): boolean {
  const v = val.trim().toLowerCase();
  return v === '✗' || v === 'no' || v === 'false';
}

export default function ComparisonMatrixLayout({ slide, theme, totalSlides }: SlideProps) {
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const borderColor = theme.decorative.cardBorder.replace(/^[\d.]+px\s+solid\s+/, '');

  const headers = slide.bullets.length > 0 ? parseHeaders(slide.bullets[0]) : [];
  const rows = slide.bullets.slice(1).map(parseRow);
  const colCount = headers.length;
  const smallFont = colCount > 5;

  // Build accent at low opacity for header bg
  const accentRgb = accent.replace('#', '');
  const ar = parseInt(accentRgb.substring(0, 2), 16);
  const ag = parseInt(accentRgb.substring(2, 4), 16);
  const ab = parseInt(accentRgb.substring(4, 6), 16);
  const headerBg = `rgba(${ar}, ${ag}, ${ab}, 0.08)`;
  const altRowBg = `rgba(${ar}, ${ag}, ${ab}, 0.03)`;

  const cellFontSize = smallFont ? 11 : 12;
  const headerFontSize = smallFont ? 10 : 11;

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
              marginBottom: 12,
            }}
          >
            {slide.subheadline}
          </p>
        )}

        {/* Matrix table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            {/* Header row */}
            {headers.length > 0 && (
              <thead>
                <tr>
                  {/* Empty top-left cell for entity column */}
                  <th
                    style={{
                      width: colCount > 4 ? '18%' : '22%',
                      background: headerBg,
                      padding: '8px 10px',
                      borderBottom: `1px solid ${borderColor}`,
                      borderRight: `1px solid ${borderColor}`,
                    }}
                  />
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      style={{
                        background: headerBg,
                        padding: '8px 6px',
                        fontSize: headerFontSize,
                        fontWeight: 700,
                        color: theme.typography.body,
                        textAlign: 'center',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.04em',
                        borderBottom: `1px solid ${borderColor}`,
                        borderRight: i < headers.length - 1 ? `1px solid ${borderColor}` : 'none',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}

            {/* Data rows */}
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    background: ri % 2 === 1 ? altRowBg : 'transparent',
                  }}
                >
                  {/* Entity name */}
                  <td
                    style={{
                      padding: '8px 10px',
                      fontSize: cellFontSize,
                      fontWeight: 600,
                      color: theme.typography.body,
                      textAlign: 'left',
                      borderBottom: ri < rows.length - 1 ? `0.5px solid ${borderColor}` : 'none',
                      borderRight: `1px solid ${borderColor}`,
                      lineHeight: 1.4,
                    }}
                  >
                    {row.entity}
                  </td>
                  {/* Cell values */}
                  {headers.map((_, ci) => {
                    const val = row.cells[ci] || '';
                    return (
                      <td
                        key={ci}
                        style={{
                          padding: '8px 6px',
                          fontSize: cellFontSize,
                          color: theme.typography.muted,
                          textAlign: 'center',
                          borderBottom: ri < rows.length - 1 ? `0.5px solid ${borderColor}` : 'none',
                          borderRight: ci < headers.length - 1 ? `0.5px solid ${borderColor}` : 'none',
                          lineHeight: 1.4,
                        }}
                      >
                        {isPositive(val) ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block' }}>
                            <circle cx="12" cy="12" r="10" fill="#dcfce7" />
                            <path d="M8 12l2.5 2.5L16 9.5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : isNegative(val) ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block' }}>
                            <circle cx="12" cy="12" r="10" fill="#fee2e2" />
                            <path d="M9 9l6 6M15 9l-6 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
