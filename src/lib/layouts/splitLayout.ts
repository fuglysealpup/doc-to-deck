import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement, MARGIN_L, MARGIN_T, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { parseBulletLeadIn, counterElement } from './common';

// Matches SplitLayout.tsx: padding 44px 56px, flex gap-12 (48px ≈ 36pt)
const GAP = 36;

export function splitLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const elements: LayoutElement[] = [];
  const barWidth = parseInt(theme.decorative.accentBarWidth) || 0;
  const leftW = Math.floor((CONTENT_W - GAP) / 2);
  const rightW = CONTENT_W - leftW - GAP;
  const rightX = MARGIN_L + leftW + GAP;

  // Accent bar (full height left edge)
  if (barWidth > 0) {
    elements.push({
      id: `bar_${n}`, type: 'shape',
      x: 0, y: 0, width: barWidth, height: 405,
      style: { backgroundColor: accent },
    });
  }

  // Left column: accent line, badge, headline, subheadline
  elements.push({
    id: `accent_${n}`, type: 'shape',
    x: MARGIN_L, y: MARGIN_T, width: 36, height: 2,
    style: { backgroundColor: accent },
  });
  elements.push({
    id: `badge_${n}`, type: 'text',
    x: MARGIN_L, y: MARGIN_T + 20, width: 80, height: 20,
    content: slide.type.toUpperCase(),
    style: { fontSize: 10, fontWeight: 'bold', color: badge.color, backgroundColor: badge.background, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10 },
  });
  elements.push({
    id: `headline_${n}`, type: 'text',
    x: MARGIN_L, y: MARGIN_T + 50, width: leftW, height: 70,
    content: slide.headline,
    style: { fontSize: parseInt(theme.typography.headlineMd) || 22, fontWeight: 'bold', color: theme.typography.body, lineHeight: 1.3 },
  });

  let leftY = MARGIN_T + 125;
  if (slide.subheadline) {
    elements.push({
      id: `sub_${n}`, type: 'text',
      x: MARGIN_L, y: leftY, width: leftW, height: 50,
      content: slide.subheadline,
      style: { fontSize: 14, color: theme.typography.muted, lineHeight: 1.5 },
    });
  }

  // Counter at bottom left
  elements.push({
    id: `counter_${n}`, type: 'text',
    x: MARGIN_L, y: 405 - MARGIN_B - 14, width: 50, height: 14,
    content: `${n} / ${totalSlides}`,
    style: { fontSize: 11, color: theme.typography.muted, opacity: 0.6 },
  });

  // Right column: mini cards
  const cardGap = 8;
  const availH = 405 - MARGIN_T - MARGIN_B;
  const cardCount = slide.bullets.length;
  const cardH = cardCount > 0 ? Math.min(70, Math.floor((availH - (cardCount - 1) * cardGap) / cardCount)) : 60;

  slide.bullets.forEach((bullet, i) => {
    const y = MARGIN_T + i * (cardH + cardGap);
    const parsed = parseBulletLeadIn(bullet);

    elements.push({
      id: `card_${n}_${i}`, type: 'shape',
      x: rightX, y, width: rightW, height: cardH,
      style: { backgroundColor: theme.decorative.cardBackground, borderRadius: 8, borderColor: theme.decorative.cardBorder.replace(/^[\d.]+px\s+solid\s+/, ''), borderWidth: 0.5 },
      children: [{
        id: `cardtxt_${n}_${i}`, type: 'text',
        x: rightX + 14, y: y + 10, width: rightW - 28, height: cardH - 20,
        content: parsed ? `${parsed.lead} ${parsed.rest}` : bullet,
        richContent: parsed ? [{ bold: parsed.lead, regular: ` ${parsed.rest}` }] : undefined,
        style: { fontSize: 13, color: theme.typography.body, lineHeight: 1.5 },
      }],
    });
  });

  return { elements, background: bg };
}
