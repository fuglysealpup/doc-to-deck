import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement } from '../layoutSpec';
import { FontTier } from './textMeasure';

// Matches DividerLayout.tsx: accent gradient bg, centered white text
export function dividerLayoutSpec(slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier): LayoutSpec {
  const n = slide.slide_number;
  const accent = theme.accents[slide.type];
  const elements: LayoutElement[] = [];

  // Thin rule above headline
  elements.push({
    id: `rule_${n}`, type: 'shape',
    x: 340, y: 155, width: 40, height: 2,
    style: { backgroundColor: 'rgba(255,255,255,0.4)' },
  });

  // Headline centered
  elements.push({
    id: `headline_${n}`, type: 'text',
    x: 100, y: 168, width: 520, height: 80,
    content: slide.headline,
    style: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', alignment: 'center', lineHeight: 1.3 },
  });

  // Subheadline
  if (slide.subheadline) {
    elements.push({
      id: `sub_${n}`, type: 'text',
      x: 120, y: 255, width: 480, height: 40,
      content: slide.subheadline,
      style: { fontSize: 15, color: 'rgba(255,255,255,0.6)', alignment: 'center', lineHeight: 1.5 },
    });
  }

  // Counter
  elements.push({
    id: `counter_${n}`, type: 'text',
    x: 720 - 40 - 50, y: 405 - 28 - 14, width: 50, height: 14,
    content: `${n} / ${totalSlides}`,
    style: { fontSize: 11, color: 'rgba(255,255,255,0.3)', alignment: 'right' },
  });

  // Use accent color as background (the export converter will handle this)
  return { elements, background: accent, fit: 'ok' };
}
