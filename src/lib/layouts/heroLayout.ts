import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement, CONTENT_W } from '../layoutSpec';
import { estimateTextHeight, estimateLines, estimateBadgeWidth, FontTier } from './textMeasure';
import { getReadableColors, isDark } from './readability';

const PAD_V = 56;
const PAD_H = 64;
const W = 720 - PAD_H * 2;

// Blend accent at low opacity with slide background for decorative circles
function blendAccent(accent: string, bg: string, opacity: number): string {
  const ah = accent.replace('#', '');
  const bh = bg.replace('#', '');
  const blend = (ac: number, bc: number) => Math.round(opacity * ac + (1 - opacity) * bc);
  const r = blend(parseInt(ah.substring(0, 2), 16), parseInt(bh.substring(0, 2), 16));
  const g = blend(parseInt(ah.substring(2, 4), 16), parseInt(bh.substring(2, 4), 16));
  const b = blend(parseInt(ah.substring(4, 6), 16), parseInt(bh.substring(4, 6), 16));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function heroLayoutSpec(slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const colors = getReadableColors(bg, theme, slide.type);
  const isClosing = slide.type === 'closing';
  const elements: LayoutElement[] = [];

  // Decorative circles (matches HeroLayout.tsx when theme.decorative.useDecoCircles)
  if (theme.decorative.useDecoCircles && isDark(bg)) {
    const circleColor = blendAccent(accent, bg, 0.06);
    elements.push({
      id: `deco_circle1_${n}`, type: 'ellipse',
      x: 720 * 0.62, y: -405 * 0.15, width: 720 * 0.45, height: 720 * 0.45,
      style: { backgroundColor: circleColor },
    });
    elements.push({
      id: `deco_circle2_${n}`, type: 'ellipse',
      x: -720 * 0.10, y: 405 * 0.80, width: 720 * 0.35, height: 720 * 0.35,
      style: { backgroundColor: circleColor },
    });
  }

  if (isClosing) {
    const badgeText = slide.type.toUpperCase();
    elements.push({
      id: `badge_${n}`, type: 'text',
      x: (720 - estimateBadgeWidth(badgeText, 10)) / 2, y: 140, width: estimateBadgeWidth(badgeText, 10), height: 20,
      content: badgeText,
      style: { fontSize: 10, fontWeight: 'bold', color: colors.badgeText, backgroundColor: colors.badgeBackground, alignment: 'center', textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10 },
    });

    let headlineFont = 30;
    let headlineH = estimateTextHeight(slide.headline, headlineFont, W, 1.2);
    elements.push({
      id: `headline_${n}`, type: 'text',
      x: PAD_H, y: 170, width: W, height: headlineH,
      content: slide.headline,
      style: { fontSize: headlineFont, fontWeight: 'bold', color: colors.headline, alignment: 'center', lineHeight: 1.2 },
    });

    if (slide.subheadline) {
      const subY = 170 + headlineH + 10;
      const subH = estimateTextHeight(slide.subheadline, 15, W, 1.5);
      elements.push({
        id: `sub_${n}`, type: 'text',
        x: PAD_H, y: subY, width: W, height: subH,
        content: slide.subheadline,
        style: { fontSize: 15, color: colors.muted, alignment: 'center', lineHeight: 1.5 },
      });
    }
  } else {
    // Title: bottom-anchored, cascading upward from bottom
    const badgeText = slide.type.toUpperCase();

    // Measure headline to position correctly
    let headlineFont = 30;
    if (estimateLines(slide.headline, headlineFont, W) > 3) headlineFont = 26;
    const headlineH = estimateTextHeight(slide.headline, headlineFont, W, 1.2);

    // Position from bottom up
    const bottomY = 405 - PAD_V;
    let subH = 0;
    if (slide.subheadline) {
      // For title, subheadline is used as eyebrow above badge
    }

    // Eyebrow (uses subheadline text or "Presentation")
    const eyebrowY = bottomY - headlineH - 20 - 20 - 12 - 18;
    elements.push({
      id: `eyebrow_${n}`, type: 'text',
      x: PAD_H, y: eyebrowY, width: W, height: 18,
      content: slide.subheadline || 'Presentation',
      style: { fontSize: 11, fontWeight: 'bold', color: accent, textTransform: 'uppercase', letterSpacing: '0.08em' },
    });

    // Badge
    const badgeY = eyebrowY + 18 + 8;
    elements.push({
      id: `badge_${n}`, type: 'text',
      x: PAD_H, y: badgeY, width: estimateBadgeWidth(badgeText, 10), height: 20,
      content: badgeText,
      style: { fontSize: 10, fontWeight: 'bold', color: colors.badgeText, backgroundColor: colors.badgeBackground, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10 },
    });

    // Headline
    const headlineY = badgeY + 20 + 12;
    elements.push({
      id: `headline_${n}`, type: 'text',
      x: PAD_H, y: headlineY, width: W, height: headlineH,
      content: slide.headline,
      style: { fontSize: headlineFont, fontWeight: 'bold', color: colors.headline, lineHeight: 1.2 },
    });
  }

  elements.push({
    id: `counter_${n}`, type: 'text',
    x: W + PAD_H - 50, y: 405 - PAD_V - 14, width: 50, height: 14,
    content: `${n} / ${totalSlides}`,
    style: { fontSize: 11, color: colors.counterColor, alignment: 'right' },
  });

  return { elements, background: bg, fit: 'ok' };
}
