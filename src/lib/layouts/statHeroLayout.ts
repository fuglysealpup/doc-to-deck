import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';

export function statHeroLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const { elements, nextY } = commonHeader(slide, theme);
  const stats = slide.bullets.slice(0, 3);
  const count = stats.length || 1;
  const gap = 24;
  const colW = Math.floor((CONTENT_W - (count - 1) * gap) / count);
  const statY = Math.max(nextY + 20, 210);

  stats.forEach((bullet, i) => {
    const parsed = parseBulletLeadIn(bullet);
    const statText = parsed ? parsed.lead : bullet;
    const labelText = parsed ? parsed.rest : '';
    const colX = MARGIN_L + i * (colW + gap);

    // Stat value — large, bold, accent color
    elements.push({
      id: `stat_${n}_${i}`, type: 'text',
      x: colX, y: statY, width: colW, height: 50,
      content: statText,
      style: { fontSize: 30, fontWeight: 'bold', color: accent, alignment: 'center', lineHeight: 1.2 },
    });

    // Description — small, uppercase, muted
    if (labelText) {
      elements.push({
        id: `statlbl_${n}_${i}`, type: 'text',
        x: colX, y: statY + 55, width: colW, height: 60,
        content: labelText.toUpperCase(),
        style: { fontSize: 9, color: theme.typography.muted, alignment: 'center', textTransform: 'uppercase', lineHeight: 1.4 },
      });
    }
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  return { elements, background: bg };
}
