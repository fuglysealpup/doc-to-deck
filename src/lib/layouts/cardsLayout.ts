import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement, MARGIN_L, MARGIN_T, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';

export function cardsLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const { elements, nextY } = commonHeader(slide, theme);

  const cards = slide.bullets.slice(0, 6);
  const cols = cards.length <= 3 ? cards.length : Math.ceil(cards.length / 2);
  const rows = Math.ceil(cards.length / cols);
  const gap = 12;
  const cardW = Math.floor((CONTENT_W - (cols - 1) * gap) / cols);
  const availH = 405 - nextY - MARGIN_B;
  const cardH = Math.min(80, Math.floor((availH - (rows - 1) * gap) / rows));

  cards.forEach((bullet, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = MARGIN_L + col * (cardW + gap);
    const y = nextY + row * (cardH + gap);
    const parsed = parseBulletLeadIn(bullet);

    elements.push({
      id: `card_${n}_${i}`, type: 'shape',
      x, y, width: cardW, height: cardH,
      style: { backgroundColor: theme.decorative.cardBackground, borderRadius: 8, borderColor: theme.decorative.cardBorder.replace(/^[\d.]+px\s+solid\s+/, ''), borderWidth: 0.5 },
      children: [{
        id: `cardtxt_${n}_${i}`, type: 'text',
        x: x + 14, y: y + 10, width: cardW - 28, height: cardH - 20,
        content: parsed ? `${parsed.lead}\n${parsed.rest}` : bullet,
        richContent: parsed ? [{ bold: parsed.lead, regular: `\n${parsed.rest}` }] : undefined,
        style: { fontSize: 13, color: theme.typography.body, lineHeight: 1.5 },
      }],
    });
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  return { elements, background: bg };
}
