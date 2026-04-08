import { Slide, Theme } from '@/src/types/deck';
import { LayoutElement, MARGIN_L, MARGIN_T, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { estimateTextHeight, estimateLines, estimateBadgeWidth, FONT_TIERS, FontTier } from './textMeasure';

export function parseBulletLeadIn(bullet: string): { lead: string; rest: string } | null {
  const match = bullet.match(/^(.+?)\s—\s(.+)$/);
  return match ? { lead: match[1], rest: match[2] } : null;
}

// Common header: accent line + badge + headline + subheadline
// Uses text measurement for cascading Y positions
export function commonHeader(
  slide: Slide,
  theme: Theme,
  headlineWidth: number = CONTENT_W,
): { elements: LayoutElement[]; nextY: number; tier: FontTier } {
  const n = slide.slide_number;
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const elements: LayoutElement[] = [];
  let currentY = MARGIN_T;

  // Accent line
  elements.push({
    id: `accent_${n}`, type: 'shape',
    x: MARGIN_L, y: currentY, width: 36, height: 2,
    style: { backgroundColor: accent },
  });
  currentY += 2 + 14; // line height + gap

  // Badge
  const badgeText = slide.type.toUpperCase();
  const badgeW = estimateBadgeWidth(badgeText, 10);
  elements.push({
    id: `badge_${n}`, type: 'text',
    x: MARGIN_L, y: currentY, width: badgeW, height: 20,
    content: badgeText,
    style: {
      fontSize: 10, fontWeight: 'bold',
      color: badge.color, backgroundColor: badge.background,
      letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 10,
    },
  });
  currentY += 20 + 12; // badge height + gap

  // Headline — check if it needs compact tier
  let headlineFontSize = FONT_TIERS.standard.headline;
  let headlineH = estimateTextHeight(slide.headline, headlineFontSize, headlineWidth, 1.3);
  const headlineLines = estimateLines(slide.headline, headlineFontSize, headlineWidth);
  let tier: FontTier = 'standard';

  if (headlineLines > 3) {
    headlineFontSize = FONT_TIERS.compact.headline;
    headlineH = estimateTextHeight(slide.headline, headlineFontSize, headlineWidth, 1.3);
    tier = 'compact';
  }

  elements.push({
    id: `headline_${n}`, type: 'text',
    x: MARGIN_L, y: currentY, width: headlineWidth, height: headlineH,
    content: slide.headline,
    style: {
      fontSize: headlineFontSize,
      fontWeight: 'bold', color: theme.typography.body, lineHeight: 1.3,
    },
  });
  currentY += headlineH + 8;

  // Subheadline
  if (slide.subheadline) {
    const subFontSize = tier === 'compact' ? FONT_TIERS.compact.subheadline : FONT_TIERS.standard.subheadline;
    const subH = estimateTextHeight(slide.subheadline, subFontSize, headlineWidth, 1.5);
    elements.push({
      id: `sub_${n}`, type: 'text',
      x: MARGIN_L, y: currentY, width: headlineWidth, height: subH,
      content: slide.subheadline,
      style: { fontSize: subFontSize, color: theme.typography.muted, lineHeight: 1.5 },
    });
    currentY += subH + 12;
  }

  return { elements, nextY: currentY, tier };
}

export function counterElement(n: number, totalSlides: number, color: string): LayoutElement {
  return {
    id: `counter_${n}`, type: 'text',
    x: CONTENT_W + MARGIN_L - 50, y: 405 - MARGIN_B - 14, width: 50, height: 14,
    content: `${n} / ${totalSlides}`,
    style: { fontSize: 11, color, alignment: 'right', opacity: 0.6 },
  };
}
