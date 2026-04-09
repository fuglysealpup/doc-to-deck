import { Theme, SlideIntent } from '@/src/types/deck';

export function isDark(color: string): boolean {
  if (!color) return false;
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return (+match[1] + +match[2] + +match[3]) < 384;
    return false;
  }
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return (+match[1] + +match[2] + +match[3]) < 384;
    return false;
  }
  const h = color.replace('#', '');
  if (h.length < 6) return false;
  return parseInt(h.substring(0, 2), 16) + parseInt(h.substring(2, 4), 16) + parseInt(h.substring(4, 6), 16) < 384;
}

export interface ReadableColors {
  headline: string;
  body: string;
  muted: string;
  accent: string;
  badgeBackground: string;
  badgeText: string;
  cardBackground: string;
  counterColor: string;
}

export function getReadableColors(
  slideBackground: string,
  theme: Theme,
  slideType: SlideIntent
): ReadableColors {
  const dark = isDark(slideBackground);
  const accent = theme.accents[slideType];
  const badge = theme.badges[slideType];
  const bc = ensureBadgeContrast(badge.background, badge.color, slideBackground);

  if (dark) {
    return {
      headline: '#ffffff',
      body: '#ffffff',
      muted: 'rgba(255,255,255,0.65)',
      accent,
      badgeBackground: bc.background,
      badgeText: bc.color,
      cardBackground: 'rgba(255,255,255,0.08)',
      counterColor: 'rgba(255,255,255,0.4)',
    };
  }
  return {
    headline: theme.typography.body,
    body: theme.typography.body,
    muted: theme.typography.muted,
    accent,
    badgeBackground: bc.background,
    badgeText: bc.color,
    cardBackground: theme.decorative.cardBackground,
    counterColor: theme.typography.muted,
  };
}

function ensureBadgeContrast(
  badgeBg: string, badgeText: string, slideBg: string
): { background: string; color: string } {
  const slideDark = isDark(slideBg);
  const badgeBgIsTransparent = badgeBg.startsWith('rgba') && parseFloat(badgeBg.split(',')[3] || '1') < 0.3;

  if (slideDark) {
    return {
      background: badgeBgIsTransparent ? badgeBg : 'rgba(255,255,255,0.15)',
      color: 'rgba(255,255,255,0.85)',
    };
  }
  if (badgeBgIsTransparent) {
    return {
      background: '#eeedf5',
      color: badgeText.startsWith('rgba') ? '#555555' : badgeText,
    };
  }
  const badgeBgDark = isDark(badgeBg);
  const textDark = isDark(badgeText.startsWith('rgba') ? '#ffffff' : badgeText);
  if (badgeBgDark === textDark) {
    return { background: badgeBg, color: badgeBgDark ? '#ffffff' : '#333333' };
  }
  return { background: badgeBg, color: badgeText };
}

export function ensureReadable(textColor: string, bgColor: string): string {
  const textDark = isDark(textColor);
  const bgDark = isDark(bgColor);
  if (textDark === bgDark) return bgDark ? '#ffffff' : '#1a1a1a';
  return textColor;
}
