import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement } from './common';
import { estimateTextHeight, determineFontTier, FONT_TIERS } from './textMeasure';

export function referenceLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const { elements, nextY, tier: headerTier } = commonHeader(slide, theme);
  const textW = CONTENT_W - 16;
  const availH = 405 - MARGIN_B - nextY;

  let bodyFont = FONT_TIERS.standard.body;
  const stdHeights = slide.bullets.map(b => estimateTextHeight(b, bodyFont, textW, 1.5));
  const stdTotal = stdHeights.reduce((s, h) => s + h, 0);
  const tier = determineFontTier(stdTotal, availH);
  if (tier !== 'standard') bodyFont = FONT_TIERS.compact.body;

  let currentY = nextY;
  slide.bullets.forEach((bullet, i) => {
    const h = estimateTextHeight(bullet, bodyFont, textW, 1.5);

    elements.push({
      id: `refbar_${n}_${i}`, type: 'shape',
      x: MARGIN_L, y: currentY, width: 2, height: h,
      style: { backgroundColor: accent },
    });
    elements.push({
      id: `reftxt_${n}_${i}`, type: 'text',
      x: MARGIN_L + 16, y: currentY, width: textW, height: h,
      content: bullet,
      style: { fontSize: bodyFont, color: theme.typography.body, lineHeight: 1.5 },
    });
    currentY += h + 4;
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  const fit = (headerTier === 'compact' || tier !== 'standard') ? (tier === 'overflow' ? 'overflow' as const : 'compact' as const) : 'ok' as const;
  return { elements, background: bg, fit };
}
