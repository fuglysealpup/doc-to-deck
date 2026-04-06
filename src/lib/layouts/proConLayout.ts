import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement, MARGIN_L, MARGIN_T, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement } from './common';

// Matches ProConLayout.tsx
const PRO_COLOR = '#1a7a4c';
const CON_COLOR = '#b45309';
const PRO_BG = 'rgba(26, 122, 76, 0.05)';
const CON_BG = 'rgba(180, 83, 9, 0.05)';

export function proConLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const { elements, nextY } = commonHeader(slide, theme);

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
  const colH = 405 - colY - MARGIN_B;
  const rightX = MARGIN_L + colW + colGap;

  // Pro column background
  elements.push({
    id: `probg_${n}`, type: 'shape',
    x: MARGIN_L, y: colY, width: colW, height: colH,
    style: { backgroundColor: '#e6f5ef', borderRadius: 10 },
  });
  // Pro header
  elements.push({
    id: `prohdr_${n}`, type: 'text',
    x: MARGIN_L + 16, y: colY + 12, width: colW - 32, height: 18,
    content: 'BENEFITS',
    style: { fontSize: 10, fontWeight: 'bold', color: PRO_COLOR, textTransform: 'uppercase', letterSpacing: '0.08em' },
  });
  // Pro items
  if (pros.length > 0) {
    elements.push({
      id: `pros_${n}`, type: 'text',
      x: MARGIN_L + 16, y: colY + 38, width: colW - 32, height: colH - 50,
      content: pros.map(p => `✓  ${p}`).join('\n'),
      style: { fontSize: 12, color: theme.typography.body, lineHeight: 1.5 },
    });
  }

  // Con column background
  elements.push({
    id: `conbg_${n}`, type: 'shape',
    x: rightX, y: colY, width: colW, height: colH,
    style: { backgroundColor: '#fef3e2', borderRadius: 10 },
  });
  // Con header
  elements.push({
    id: `conhdr_${n}`, type: 'text',
    x: rightX + 16, y: colY + 12, width: colW - 32, height: 18,
    content: 'CHALLENGES',
    style: { fontSize: 10, fontWeight: 'bold', color: CON_COLOR, textTransform: 'uppercase', letterSpacing: '0.08em' },
  });
  // Con items
  if (cons.length > 0) {
    elements.push({
      id: `cons_${n}`, type: 'text',
      x: rightX + 16, y: colY + 38, width: colW - 32, height: colH - 50,
      content: cons.map(c => `⚠  ${c}`).join('\n'),
      style: { fontSize: 12, color: theme.typography.body, lineHeight: 1.5 },
    });
  }

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  return { elements, background: bg };
}
