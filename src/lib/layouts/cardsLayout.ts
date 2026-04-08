import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';
import { estimateCardHeight, determineFontTier, FONT_TIERS } from './textMeasure';

export function cardsLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const { elements, nextY, tier: headerTier } = commonHeader(slide, theme);

  const cards = slide.bullets.slice(0, 6);
  const cols = cards.length <= 3 ? cards.length : Math.ceil(cards.length / 2);
  const rows = Math.ceil(cards.length / cols);
  const gap = 12;
  const cardW = Math.floor((CONTENT_W - (cols - 1) * gap) / cols);
  const availH = 405 - nextY - MARGIN_B;

  // Measure card heights at standard tier
  let bodyFont = FONT_TIERS.standard.body;
  const stdHeights = cards.map(b => estimateCardHeight(b, bodyFont, cardW));
  const maxStdRowH = Array.from({ length: rows }, (_, r) => {
    const rowCards = cards.slice(r * cols, (r + 1) * cols);
    return Math.max(...rowCards.map((b) => estimateCardHeight(b, bodyFont, cardW)));
  });
  const stdTotal = maxStdRowH.reduce((s, h) => s + h, 0) + (rows - 1) * gap;
  const tier = determineFontTier(stdTotal, availH);

  if (tier !== 'standard') bodyFont = FONT_TIERS.compact.body;

  // Recalculate row heights at chosen tier
  const rowHeights = Array.from({ length: rows }, (_, r) => {
    const rowCards = cards.slice(r * cols, (r + 1) * cols);
    return Math.max(...rowCards.map((b) => estimateCardHeight(b, bodyFont, cardW)));
  });

  let cardY = nextY;
  cards.forEach((bullet, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = MARGIN_L + col * (cardW + gap);
    if (col === 0 && row > 0) cardY += rowHeights[row - 1] + gap;
    const y = row === 0 ? nextY : cardY;
    const h = rowHeights[row];
    const parsed = parseBulletLeadIn(bullet);

    elements.push({
      id: `card_${n}_${i}`, type: 'shape',
      x, y, width: cardW, height: h,
      style: { backgroundColor: theme.decorative.cardBackground, borderRadius: 8, borderColor: theme.decorative.cardBorder.replace(/^[\d.]+px\s+solid\s+/, ''), borderWidth: 0.5 },
      children: [{
        id: `cardtxt_${n}_${i}`, type: 'text',
        x: x + 14, y: y + 10, width: cardW - 28, height: h - 20,
        content: parsed ? `${parsed.lead}\n${parsed.rest}` : bullet,
        richContent: parsed ? [{ bold: parsed.lead, regular: `\n${parsed.rest}` }] : undefined,
        style: { fontSize: bodyFont, color: theme.typography.body, lineHeight: 1.5 },
      }],
    });
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  const fit = (headerTier === 'compact' || tier !== 'standard') ? (tier === 'overflow' ? 'overflow' as const : 'compact' as const) : 'ok' as const;
  return { elements, background: bg, fit };
}
