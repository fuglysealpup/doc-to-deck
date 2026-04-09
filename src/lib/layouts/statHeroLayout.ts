import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';
import { estimateTextHeight, FONT_TIERS, FontTier } from './textMeasure';
import { getReadableColors } from './readability';

export function statHeroLayoutSpec(slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const { elements, nextY, colors } = commonHeader(slide, theme, undefined, forceTier);
  const stats = slide.bullets.slice(0, 3);
  const count = stats.length || 1;
  const gap = 24;
  const colW = Math.floor((CONTENT_W - (count - 1) * gap) / count);
  const statY = Math.max(nextY + 20, 210);

  // Measure description heights to ensure they fit
  const availH = 405 - MARGIN_B - statY - 55; // stat value takes ~50pt
  const statFont = FONT_TIERS.standard.statValue;
  const descFont = FONT_TIERS.standard.statDescription;

  stats.forEach((bullet, i) => {
    const parsed = parseBulletLeadIn(bullet);
    const statText = parsed ? parsed.lead : bullet;
    const labelText = parsed ? parsed.rest : '';
    const colX = MARGIN_L + i * (colW + gap);
    const statH = estimateTextHeight(statText, statFont, colW, 1.2);

    elements.push({
      id: `stat_${n}_${i}`, type: 'text',
      x: colX, y: statY, width: colW, height: statH,
      content: statText,
      style: { fontSize: statFont, fontWeight: 'bold', color: accent, alignment: 'center', lineHeight: 1.2 },
    });

    if (labelText) {
      const descH = Math.min(estimateTextHeight(labelText, descFont, colW, 1.4), availH);
      elements.push({
        id: `statlbl_${n}_${i}`, type: 'text',
        x: colX, y: statY + statH + 8, width: colW, height: descH,
        content: labelText.toUpperCase(),
        style: { fontSize: descFont, color: colors.muted, alignment: 'center', textTransform: 'uppercase', lineHeight: 1.4 },
      });
    }
  });

  elements.push(counterElement(n, totalSlides, colors.counterColor));
  return { elements, background: bg, fit: 'ok' };
}
