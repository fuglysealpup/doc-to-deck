import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, MARGIN_L, MARGIN_B, CONTENT_W } from '../layoutSpec';
import { commonHeader, counterElement, parseBulletLeadIn } from './common';
import { estimateTextHeight, determineFontTier, FONT_TIERS } from './textMeasure';

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
  const { elements, nextY, tier: headerTier } = commonHeader(slide, theme);
  const labelW = 90;
  const gap = 14;
  const textW = CONTENT_W - labelW - gap;
  const availH = 405 - MARGIN_B - nextY;

  // Measure row heights
  let bodyFont = FONT_TIERS.standard.body;
  const rowTexts = slide.bullets.map(b => parseTimeLabel(b).text);
  const stdHeights = rowTexts.map(t => Math.max(24, estimateTextHeight(t, bodyFont, textW, 1.5)));
  const stdTotal = stdHeights.reduce((s, h) => s + h, 0) + Math.max(0, slide.bullets.length - 1) * 4;
  const tier = determineFontTier(stdTotal, availH);
  if (tier !== 'standard') bodyFont = FONT_TIERS.compact.body;

  const rowHeights = rowTexts.map(t => Math.max(22, estimateTextHeight(t, bodyFont, textW, 1.5)));
  let currentY = nextY;

  slide.bullets.forEach((bullet, i) => {
    const { label, text } = parseTimeLabel(bullet);
    const displayLabel = label || `Phase ${i + 1}`;
    const parsed = parseBulletLeadIn(text);
    const h = rowHeights[i];
    const isLast = i === slide.bullets.length - 1;

    elements.push({
      id: `tlabel_${n}_${i}`, type: 'text',
      x: MARGIN_L, y: currentY, width: labelW, height: h,
      content: displayLabel,
      style: { fontSize: 11, fontWeight: 'bold', color: accent, textTransform: 'uppercase', letterSpacing: '0.04em' },
    });
    elements.push({
      id: `tcontent_${n}_${i}`, type: 'text',
      x: MARGIN_L + labelW + gap, y: currentY, width: textW, height: h,
      content: parsed ? `${parsed.lead} ${parsed.rest}` : text,
      richContent: parsed ? [{ bold: parsed.lead, regular: ` ${parsed.rest}` }] : undefined,
      style: { fontSize: bodyFont, color: theme.typography.body, lineHeight: 1.5 },
    });

    if (!isLast) {
      elements.push({
        id: `tsep_${n}_${i}`, type: 'shape',
        x: MARGIN_L, y: currentY + h + 2, width: CONTENT_W, height: 0.5,
        style: { backgroundColor: borderColor },
      });
    }
    currentY += h + 4;
  });

  elements.push(counterElement(n, totalSlides, theme.typography.muted));
  const fit = (headerTier === 'compact' || tier !== 'standard') ? (tier === 'overflow' ? 'overflow' as const : 'compact' as const) : 'ok' as const;
  return { elements, background: bg, fit };
}
