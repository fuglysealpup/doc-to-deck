import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement } from './common';
import { estimateBulletListHeight, determineFontTier, FONT_TIERS, FontTier } from './textMeasure';
import { getReadableColors } from './readability';

const PRO_COLOR = '#1a7a4c';
const CON_COLOR = '#b45309';

export function proConLayoutSpec(slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const { elements, nextY, tier: headerTier, colors } = commonHeader(slide, theme, undefined, forceTier);

  const pros: string[] = [];
  const cons: string[] = [];
  for (const b of slide.bullets) {
    const t = b.trim();
    if (/^CON:\s*/i.test(t)) cons.push(t.replace(/^CON:\s*/i, ''));
    else if (/^PRO:\s*/i.test(t)) pros.push(t.replace(/^PRO:\s*/i, ''));
    else pros.push(t);
  }

  const colGap = 16;
  const colW = Math.floor((CONTENT_W - colGap) / 2);
  const colY = nextY + 12;
  const availH = 405 - colY - MARGIN_B;
  const rightX = MARGIN_L + colW + colGap;
  const textW = colW - 32;

  // Measure tallest column
  let bodyFont = FONT_TIERS.standard.body;
  const proH = estimateBulletListHeight(pros.map(p => `✓  ${p}`), bodyFont - 1, textW, 1.5, 10);
  const conH = estimateBulletListHeight(cons.map(c => `⚠  ${c}`), bodyFont - 1, textW, 1.5, 10);
  const tallest = Math.max(proH, conH) + 50; // header + padding
  const tier = forceTier || determineFontTier(tallest, availH);
  if (tier !== 'standard') bodyFont = FONT_TIERS.compact.body;

  const colH = availH;

  // Pro column
  elements.push({ id: `probg_${n}`, type: 'shape', x: MARGIN_L, y: colY, width: colW, height: colH, style: { backgroundColor: '#e6f5ef', borderRadius: 10 } });
  elements.push({
    id: `prohdr_${n}`, type: 'text',
    x: MARGIN_L + 16, y: colY + 12, width: textW, height: 18,
    content: 'BENEFITS',
    style: { fontSize: 10, fontWeight: 'bold', color: PRO_COLOR, textTransform: 'uppercase', letterSpacing: '0.08em' },
  });
  if (pros.length > 0) {
    elements.push({
      id: `pros_${n}`, type: 'text',
      x: MARGIN_L + 16, y: colY + 38, width: textW, height: colH - 50,
      content: pros.map(p => `✓  ${p}`).join('\n'),
      style: { fontSize: bodyFont - 1, color: colors.body, lineHeight: 1.5 },
    });
  }

  // Con column
  elements.push({ id: `conbg_${n}`, type: 'shape', x: rightX, y: colY, width: colW, height: colH, style: { backgroundColor: '#fef3e2', borderRadius: 10 } });
  elements.push({
    id: `conhdr_${n}`, type: 'text',
    x: rightX + 16, y: colY + 12, width: textW, height: 18,
    content: 'CHALLENGES',
    style: { fontSize: 10, fontWeight: 'bold', color: CON_COLOR, textTransform: 'uppercase', letterSpacing: '0.08em' },
  });
  if (cons.length > 0) {
    elements.push({
      id: `cons_${n}`, type: 'text',
      x: rightX + 16, y: colY + 38, width: textW, height: colH - 50,
      content: cons.map(c => `⚠  ${c}`).join('\n'),
      style: { fontSize: bodyFont - 1, color: colors.body, lineHeight: 1.5 },
    });
  }

  elements.push(counterElement(n, totalSlides, colors.counterColor));
  const fit = (headerTier === 'compact' || tier !== 'standard') ? (tier === 'overflow' ? 'overflow' as const : 'compact' as const) : 'ok' as const;
  return { elements, background: bg, fit };
}
