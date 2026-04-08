import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { TableData, TableRow, TableCell } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';
import { FontTier } from './textMeasure';

export function tableLayoutSpec(slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const { elements, nextY } = commonHeader(slide, theme, undefined, forceTier);

  const hasPipe = slide.bullets.some(b => b.includes('|'));
  let tableData: TableData;

  if (hasPipe) {
    // Pipe-delimited format
    const headerParts = slide.bullets[0].split('|').map(s => s.trim()).filter(Boolean);
    const rows: TableRow[] = slide.bullets.slice(1).map((b, ri) => {
      const parts = b.split('|').map(s => s.trim());
      const cells: TableCell[] = [
        { content: parts[0] || '', bold: true, alignment: 'left' },
        ...headerParts.map((_, ci) => ({
          content: parts[ci + 1] || '',
          alignment: 'center' as const,
        })),
      ];
      return { cells, backgroundColor: ri % 2 === 1 ? '#f8f8f8' : undefined };
    });

    tableData = {
      headers: ['', ...headerParts],
      rows,
      headerStyle: { backgroundColor: accent, color: '#ffffff', bold: true },
    };
  } else {
    // Em-dash format — matches TableLayout.tsx parsing
    const rows: TableRow[] = slide.bullets.map((b, ri) => {
      const parsed = parseBulletLeadIn(b);
      const cells: TableCell[] = parsed
        ? [{ content: parsed.lead, bold: true, alignment: 'left' }, { content: parsed.rest, alignment: 'left' }]
        : [{ content: b, bold: false, alignment: 'left' }, { content: '', alignment: 'left' }];
      return { cells, backgroundColor: ri % 2 === 1 ? '#f8f8f8' : undefined };
    });

    tableData = {
      headers: ['Metric', 'Detail'],
      rows,
      headerStyle: { backgroundColor: accent, color: '#ffffff', bold: true },
    };
  }

  const tableH = Math.min(405 - nextY - MARGIN_B, (tableData.rows.length + 1) * 32 + 10);
  elements.push({
    id: `table_${n}`, type: 'table',
    x: MARGIN_L, y: nextY + 5, width: CONTENT_W, height: tableH,
    style: {},
    tableData,
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  const idealH = (tableData.rows.length + 1) * 32 + 10;
  const fit = idealH <= (405 - nextY - MARGIN_B) ? 'ok' as const : 'compact' as const;
  return { elements, background: bg, fit };
}
