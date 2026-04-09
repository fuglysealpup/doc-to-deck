import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement, MARGIN_L, MARGIN_T, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { parseBulletLeadIn, counterElement } from './common';
import { estimateTextHeight, estimateLines, estimateCardHeight, estimateBadgeWidth, determineFontTier, FONT_TIERS, FontTier } from './textMeasure';
import { getReadableColors } from './readability';

const GAP = 36;

export function splitLayoutSpec(slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const colors = getReadableColors(bg, theme, slide.type);
  const elements: LayoutElement[] = [];
  const barWidth = parseInt(theme.decorative.accentBarWidth) || 0;
  const leftW = Math.floor((CONTENT_W - GAP) / 2);
  const rightW = CONTENT_W - leftW - GAP;
  const rightX = MARGIN_L + leftW + GAP;

  // Accent bar
  if (barWidth > 0) {
    elements.push({ id: `bar_${n}`, type: 'shape', x: 0, y: 0, width: barWidth, height: 405, style: { backgroundColor: accent } });
  }

  // Left column: cascading Y
  let leftY = MARGIN_T;

  elements.push({ id: `accent_${n}`, type: 'shape', x: MARGIN_L, y: leftY, width: 36, height: 2, style: { backgroundColor: accent } });
  leftY += 2 + 14;

  const badgeText = slide.type.toUpperCase();
  elements.push({
    id: `badge_${n}`, type: 'text',
    x: MARGIN_L, y: leftY, width: estimateBadgeWidth(badgeText, 10), height: 20,
    content: badgeText,
    style: { fontSize: 10, fontWeight: 'bold', color: colors.badgeText, backgroundColor: colors.badgeBackground, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10 },
  });
  leftY += 20 + 12;

  let headlineFont = FONT_TIERS.standard.headline;
  if (estimateLines(slide.headline, headlineFont, leftW) > 3) headlineFont = FONT_TIERS.compact.headline;
  const headlineH = estimateTextHeight(slide.headline, headlineFont, leftW, 1.3);
  elements.push({
    id: `headline_${n}`, type: 'text',
    x: MARGIN_L, y: leftY, width: leftW, height: headlineH,
    content: slide.headline,
    style: { fontSize: headlineFont, fontWeight: 'bold', color: colors.headline, lineHeight: 1.3 },
  });
  leftY += headlineH + 8;

  if (slide.subheadline) {
    const subH = estimateTextHeight(slide.subheadline, 14, leftW, 1.5);
    elements.push({
      id: `sub_${n}`, type: 'text',
      x: MARGIN_L, y: leftY, width: leftW, height: subH,
      content: slide.subheadline,
      style: { fontSize: 14, color: colors.muted, lineHeight: 1.5 },
    });
  }

  elements.push({ id: `counter_${n}`, type: 'text', x: MARGIN_L, y: 405 - MARGIN_B - 14, width: 50, height: 14, content: `${n} / ${totalSlides}`, style: { fontSize: 11, color: colors.counterColor, opacity: 0.6 } });

  // Right column: cards with measured heights
  const cardGap = 8;
  const availH = 405 - MARGIN_T - MARGIN_B;
  const cardCount = slide.bullets.length;

  // Estimate total card height at standard tier
  let bodyFont = FONT_TIERS.standard.body;
  const standardHeights = slide.bullets.map(b => estimateCardHeight(b, bodyFont, rightW));
  const standardTotal = standardHeights.reduce((s, h) => s + h, 0) + Math.max(0, cardCount - 1) * cardGap;
  if (forceTier) { bodyFont = FONT_TIERS[forceTier === 'overflow' ? 'compact' : forceTier].body; }
  const tier = forceTier || determineFontTier(standardTotal, availH);

  if (tier !== 'standard') bodyFont = FONT_TIERS.compact.body;
  const cardHeights = slide.bullets.map(b => estimateCardHeight(b, bodyFont, rightW));
  const totalCardH = cardHeights.reduce((s, h) => s + h, 0) + Math.max(0, cardCount - 1) * cardGap;

  // Center cards vertically if they're shorter than available space
  let cardY = MARGIN_T + Math.max(0, (availH - totalCardH) / 2);

  slide.bullets.forEach((bullet, i) => {
    const parsed = parseBulletLeadIn(bullet);
    const h = cardHeights[i];

    elements.push({
      id: `card_${n}_${i}`, type: 'shape',
      x: rightX, y: cardY, width: rightW, height: h,
      style: { backgroundColor: colors.cardBackground, borderRadius: 8, borderColor: theme.decorative.cardBorder.replace(/^[\d.]+px\s+solid\s+/, ''), borderWidth: 0.5 },
      children: [{
        id: `cardtxt_${n}_${i}`, type: 'text',
        x: rightX + 14, y: cardY + 10, width: rightW - 28, height: h - 20,
        content: parsed ? `${parsed.lead} ${parsed.rest}` : bullet,
        richContent: parsed ? [{ bold: parsed.lead, regular: ` ${parsed.rest}` }] : undefined,
        style: { fontSize: bodyFont, color: colors.body, lineHeight: 1.5 },
      }],
    });
    cardY += h + cardGap;
  });

  const fit = tier === 'standard' ? 'ok' as const : tier === 'compact' ? 'compact' as const : 'overflow' as const;
  return { elements, background: bg, fit };
}
