function getCharWidthRatio(fontSize: number): number {
  if (fontSize >= 28) return 0.62;
  if (fontSize >= 18) return 0.58;
  if (fontSize >= 12) return 0.54;
  return 0.50;
}

export function estimateLines(text: string, fontSize: number, availableWidth: number): number {
  if (!text || text.length === 0) return 0;
  const avgCharWidth = fontSize * getCharWidthRatio(fontSize);
  const charsPerLine = Math.floor(availableWidth / avgCharWidth);
  if (charsPerLine <= 0) return 1;
  const lines = text.split('\n');
  let total = 0;
  for (const line of lines) {
    total += Math.max(1, Math.ceil(line.length / charsPerLine));
  }
  return total;
}

export function estimateTextHeight(
  text: string, fontSize: number, availableWidth: number, lineHeight: number = 1.3
): number {
  const lines = estimateLines(text, fontSize, availableWidth);
  return Math.max(fontSize * lineHeight, Math.ceil(lines * fontSize * lineHeight)) + 4;
}

export function estimateBulletListHeight(
  bullets: string[], fontSize: number, availableWidth: number,
  lineHeight: number = 1.3, itemSpacing: number = 4
): number {
  let total = 0;
  for (const bullet of bullets) {
    total += estimateTextHeight(bullet, fontSize, availableWidth, lineHeight);
    total += itemSpacing;
  }
  return Math.max(0, total - itemSpacing);
}

export type FontTier = 'standard' | 'compact' | 'overflow';

export function determineFontTier(totalContentHeight: number, availableHeight: number): FontTier {
  if (totalContentHeight <= availableHeight) return 'standard';
  if (totalContentHeight * 0.88 <= availableHeight) return 'compact';
  return 'overflow';
}

export const FONT_TIERS: Record<'standard' | 'compact', Record<string, number>> = {
  standard: {
    headline: 22,
    subheadline: 14,
    body: 13,
    label: 10,
    caption: 11,
    statValue: 30,
    statDescription: 10,
  },
  compact: {
    headline: 20,
    subheadline: 13,
    body: 11,
    label: 9,
    caption: 10,
    statValue: 26,
    statDescription: 9,
  },
};

export function estimateCardHeight(
  text: string, fontSize: number, cardWidth: number,
  paddingV: number = 16, paddingH: number = 36
): number {
  const textWidth = cardWidth - paddingH;
  const textHeight = estimateTextHeight(text, fontSize, textWidth);
  return textHeight + paddingV * 2;
}

export function estimateBadgeWidth(text: string, fontSize: number = 10): number {
  const charWidth = fontSize * 0.72;
  const letterSpacing = fontSize * 0.06 * text.length;
  const padding = 20;
  return Math.max(60, Math.ceil(text.length * charWidth + letterSpacing + padding));
}
