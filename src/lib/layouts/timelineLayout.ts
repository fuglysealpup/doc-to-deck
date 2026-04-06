import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';

function parseTimeLabel(bullet: string): { label: string; text: string } {
  const match = bullet.match(
    /^((?:Near|Mid|Long)\s+term|Now|Q[1-4]\s*\d{0,4}|20\d{2}|Phase\s+\d+|Month\s+[\d–-]+)[:\s–-]+\s*(.*)/i
  );
  return match ? { label: match[1].trim(), text: match[2].trim() } : { label: '', text: bullet };
}

export function timelineLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const borderColor = theme.decorative.cardBorder.replace(/^[\d.]+px\s+solid\s+/, '');
  const { elements, nextY } = commonHeader(slide, theme);
  const labelW = 90;
  const gap = 14;
  const rowH = 30;
  const rowGap = 4;

  slide.bullets.forEach((bullet, i) => {
    const { label, text } = parseTimeLabel(bullet);
    const displayLabel = label || `Phase ${i + 1}`;
    const parsed = parseBulletLeadIn(text);
    const y = nextY + i * (rowH + rowGap);
    const isLast = i === slide.bullets.length - 1;

    // Label
    elements.push({
      id: `tlabel_${n}_${i}`, type: 'text',
      x: MARGIN_L, y, width: labelW, height: rowH,
      content: displayLabel,
      style: { fontSize: 11, fontWeight: 'bold', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em' },
    });

    // Content
    elements.push({
      id: `tcontent_${n}_${i}`, type: 'text',
      x: MARGIN_L + labelW + gap, y, width: CONTENT_W - labelW - gap, height: rowH,
      content: parsed ? `${parsed.lead} ${parsed.rest}` : text,
      richContent: parsed ? [{ bold: parsed.lead, regular: ` ${parsed.rest}` }] : undefined,
      style: { fontSize: 13, color: theme.typography.body, lineHeight: 1.5 },
    });

    // Row separator
    if (!isLast) {
      elements.push({
        id: `tsep_${n}_${i}`, type: 'shape',
        x: MARGIN_L, y: y + rowH, width: CONTENT_W, height: 0.5,
        style: { backgroundColor: borderColor },
      });
    }
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  return { elements, background: bg };
}
