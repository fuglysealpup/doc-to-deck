import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement } from './common';

export function referenceLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const { elements, nextY } = commonHeader(slide, theme);
  const itemH = 30;

  slide.bullets.forEach((bullet, i) => {
    const y = nextY + i * itemH;

    // Left accent border
    elements.push({
      id: `refbar_${n}_${i}`, type: 'shape',
      x: MARGIN_L, y, width: 2, height: itemH,
      style: { backgroundColor: accent },
    });

    // Text
    elements.push({
      id: `reftxt_${n}_${i}`, type: 'text',
      x: MARGIN_L + 16, y, width: CONTENT_W - 16, height: itemH,
      content: bullet,
      style: { fontSize: 13, color: theme.typography.body, lineHeight: 1.5 },
    });
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  return { elements, background: bg };
}
