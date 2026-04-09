import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement, CONTENT_W, MARGIN_L } from '../layoutSpec';
import { estimateTextHeight, estimateBadgeWidth, FontTier } from './textMeasure';
import { getReadableColors, isDark } from './readability';

export function quoteLayoutSpec(slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const badge = theme.badges[slide.type];
  const colors = getReadableColors(bg, theme, slide.type);
  const elements: LayoutElement[] = [];
  const contentW = 520;
  const contentX = (720 - contentW) / 2;

  const badgeText = slide.type.toUpperCase();
  const badgeW = estimateBadgeWidth(badgeText, 10);
  elements.push({
    id: `badge_${n}`, type: 'text',
    x: (720 - badgeW) / 2, y: 60, width: badgeW, height: 20,
    content: badgeText,
    style: { fontSize: 10, fontWeight: 'bold', color: colors.badgeText, backgroundColor: colors.badgeBackground, alignment: 'center', textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10 },
  });

  const headlineFont = isDark(bg) ? 22 : 24;
  const headlineH = estimateTextHeight(slide.headline, headlineFont, contentW, 1.5);
  elements.push({
    id: `headline_${n}`, type: 'text',
    x: contentX, y: 95, width: contentW, height: headlineH,
    content: slide.headline,
    style: { fontSize: headlineFont, color: colors.headline, alignment: 'center', lineHeight: 1.5 },
  });

  let nextY = 95 + headlineH + 10;

  if (slide.subheadline) {
    const subH = estimateTextHeight(slide.subheadline, 14, contentW - 40, 1.5);
    elements.push({
      id: `sub_${n}`, type: 'text',
      x: contentX + 20, y: nextY, width: contentW - 40, height: subH,
      content: slide.subheadline,
      style: { fontSize: 14, color: colors.muted, alignment: 'center', lineHeight: 1.5 },
    });
    nextY += subH + 16;
  }

  if (slide.bullets.length > 0) {
    const tagsText = slide.bullets.slice(0, 3).join('  ·  ');
    elements.push({
      id: `tags_${n}`, type: 'text',
      x: MARGIN_L, y: Math.max(nextY + 10, 320), width: CONTENT_W, height: 24,
      content: tagsText,
      style: { fontSize: 11, color: colors.muted, alignment: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' },
    });
  }

  elements.push({
    id: `counter_${n}`, type: 'text',
    x: 720 - 48 - 50, y: 405 - 32 - 14, width: 50, height: 14,
    content: `${n} / ${totalSlides}`,
    style: { fontSize: 11, color: colors.counterColor, alignment: 'right', opacity: 0.6 },
  });

  return { elements, background: bg, fit: 'ok' };
}
