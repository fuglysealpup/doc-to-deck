import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';

export function listLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const { elements, nextY } = commonHeader(slide, theme);

  // Bullets as list with colored dots — matches ListLayout.tsx gap-4
  const itemGap = 16;
  const availH = 405 - nextY - MARGIN_B;
  const itemCount = slide.bullets.length;
  const itemH = itemCount > 0 ? Math.min(30, Math.floor((availH - (itemCount - 1) * itemGap) / itemCount)) : 24;

  slide.bullets.forEach((bullet, i) => {
    const y = nextY + i * (itemH + itemGap);
    const parsed = parseBulletLeadIn(bullet);

    // Dot
    elements.push({
      id: `dot_${n}_${i}`, type: 'shape',
      x: MARGIN_L, y: y + 6, width: 6, height: 6,
      style: { backgroundColor: accent, borderRadius: 3 },
    });

    // Text
    elements.push({
      id: `item_${n}_${i}`, type: 'text',
      x: MARGIN_L + 18, y, width: CONTENT_W - 18, height: itemH,
      content: parsed ? `${parsed.lead} ${parsed.rest}` : bullet,
      richContent: parsed ? [{ bold: parsed.lead, regular: ` ${parsed.rest}` }] : undefined,
      style: { fontSize: 14, color: theme.typography.body, lineHeight: 1.6 },
    });
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  return { elements, background: bg };
}
