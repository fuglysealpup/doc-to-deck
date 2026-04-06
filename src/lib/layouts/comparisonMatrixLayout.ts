import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { TableData, TableRow, TableCell } from '../layoutSpec';
import { commonHeader, counterElement } from './common';

function cellColor(val: string): string | undefined {
  const v = val.trim().toLowerCase();
  if (v === '✓' || v === 'yes' || v === 'true') return '#16a34a';
  if (v === '✗' || v === 'no' || v === 'false') return '#dc2626';
  return undefined;
}

function cellDisplay(val: string): string {
  const v = val.trim().toLowerCase();
  if (v === 'yes' || v === 'true') return '✓';
  if (v === 'no' || v === 'false') return '✗';
  return val.trim();
}

export function comparisonMatrixLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  // Tighter padding matching ComparisonMatrixLayout.tsx: 36px 48px
  const elements = commonHeader(slide, theme).elements;
  const nextY = commonHeader(slide, theme).nextY;

  const headerParts = slide.bullets.length > 0
    ? slide.bullets[0].split('|').map(s => s.trim()).filter(Boolean)
    : [];

  const rows: TableRow[] = slide.bullets.slice(1).map((b, ri) => {
    const parts = b.split('|').map(s => s.trim());
    const cells: TableCell[] = [
      { content: parts[0] || '', bold: true, alignment: 'left' },
      ...headerParts.map((_, ci) => {
        const val = parts[ci + 1] || '';
        return {
          content: cellDisplay(val),
          color: cellColor(val),
          alignment: 'center' as const,
        };
      }),
    ];
    return { cells, backgroundColor: ri % 2 === 1 ? '#f8f8f8' : undefined };
  });

  const tableData: TableData = {
    headers: ['', ...headerParts],
    rows,
    headerStyle: { backgroundColor: accent, color: '#ffffff', bold: true },
  };

  const tableH = Math.min(405 - nextY - MARGIN_B, (rows.length + 1) * 32 + 10);
  elements.push({
    id: `table_${n}`, type: 'table',
    x: MARGIN_L, y: nextY + 5, width: CONTENT_W, height: tableH,
    style: {},
    tableData,
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  return { elements, background: bg };
}
