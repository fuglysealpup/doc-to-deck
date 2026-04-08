import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';
import { estimateTextHeight, estimateBulletListHeight, determineFontTier, FONT_TIERS } from './textMeasure';

export function listLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const { elements, nextY, tier: headerTier } = commonHeader(slide, theme);

  const availH = 405 - MARGIN_B - nextY;
  const textW = CONTENT_W - 18; // dot + gap

  // Measure at standard tier
  let bodyFont = FONT_TIERS.standard.body;
  const stdH = estimateBulletListHeight(slide.bullets, bodyFont + 1, textW, 1.6, 16); // +1 for list's 14pt
  const tier = determineFontTier(stdH, availH);
  if (tier !== 'standard') bodyFont = FONT_TIERS.compact.body;

  let currentY = nextY;
  slide.bullets.forEach((bullet, i) => {
    const parsed = parseBulletLeadIn(bullet);
    const itemH = estimateTextHeight(bullet, bodyFont + 1, textW, 1.6);

    elements.push({
      id: `dot_${n}_${i}`, type: 'shape',
      x: MARGIN_L, y: currentY + 6, width: 6, height: 6,
      style: { backgroundColor: accent, borderRadius: 3 },
    });
    elements.push({
      id: `item_${n}_${i}`, type: 'text',
      x: MARGIN_L + 18, y: currentY, width: textW, height: itemH,
      content: parsed ? `${parsed.lead} ${parsed.rest}` : bullet,
      richContent: parsed ? [{ bold: parsed.lead, regular: ` ${parsed.rest}` }] : undefined,
      style: { fontSize: bodyFont + 1, color: theme.typography.body, lineHeight: 1.6 },
    });
    currentY += itemH + 16;
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  const fit = (headerTier === 'compact' || tier !== 'standard') ? (tier === 'overflow' ? 'overflow' as const : 'compact' as const) : 'ok' as const;
  return { elements, background: bg, fit };
}
