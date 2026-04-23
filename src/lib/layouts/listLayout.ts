import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';
import { estimateBulletListHeight, determineFontTier, FONT_TIERS, FontTier } from './textMeasure';
import { getReadableColors } from './readability';

export function listLayoutSpec(slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const { elements, nextY, tier: headerTier, colors } = commonHeader(slide, theme, undefined, forceTier);

  const availH = 405 - MARGIN_B - nextY;

  // Measure at standard tier
  let bodyFont = FONT_TIERS.standard.body;
  const stdH = estimateBulletListHeight(slide.bullets, bodyFont + 1, CONTENT_W, 1.6, 8);
  const tier = forceTier || determineFontTier(stdH, availH);
  if (tier !== 'standard') bodyFont = FONT_TIERS.compact.body;

  // Single bullet list element — renders as one text box with native bullets
  const bulletItems = slide.bullets.map((bullet) => {
    const parsed = parseBulletLeadIn(bullet);
    return {
      text: parsed ? `${parsed.lead} ${parsed.rest}` : bullet,
      boldLead: parsed ? parsed.lead : undefined,
    };
  });

  elements.push({
    id: `bullets_${n}`, type: 'bulletList',
    x: MARGIN_L, y: nextY, width: CONTENT_W, height: availH,
    style: { fontSize: bodyFont + 1, color: colors.body, lineHeight: 1.6 },
    bulletItems,
  });

  elements.push(counterElement(n, totalSlides, colors.counterColor));
  const fit = (headerTier === 'compact' || tier !== 'standard') ? (tier === 'overflow' ? 'overflow' as const : 'compact' as const) : 'ok' as const;
  return { elements, background: bg, fit };
}
