import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement } from '../layoutSpec';
import { FontTier } from './textMeasure';
import { getReadableColors, isDark } from './readability';

// Matches DividerLayout.tsx: accent gradient bg, centered white text
export function dividerLayoutSpec(slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier): LayoutSpec {
  const n = slide.slide_number;
  const accent = theme.accents[slide.type];
  const textColor = isDark(accent) ? '#ffffff' : '#1a1a1a';
  const mutedTextColor = isDark(accent) ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const counterTextColor = isDark(accent) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const ruleColor = isDark(accent) ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)';
  const elements: LayoutElement[] = [];

  // Geometric decoration — subtle right-side overlay (matches DividerLayout.tsx clip-path)
  // Native approximation: a slightly lighter rectangle on the right 40% of the slide
  const ah = accent.replace('#', '');
  const ar = parseInt(ah.substring(0, 2), 16);
  const ag = parseInt(ah.substring(2, 4), 16);
  const ab = parseInt(ah.substring(4, 6), 16);
  const overlayR = Math.min(255, ar + Math.round((255 - ar) * 0.04));
  const overlayG = Math.min(255, ag + Math.round((255 - ag) * 0.04));
  const overlayB = Math.min(255, ab + Math.round((255 - ab) * 0.04));
  const overlayColor = `#${overlayR.toString(16).padStart(2, '0')}${overlayG.toString(16).padStart(2, '0')}${overlayB.toString(16).padStart(2, '0')}`;
  elements.push({
    id: `deco_overlay_${n}`, type: 'shape',
    x: 720 * 0.55, y: 0, width: 720 * 0.45, height: 405,
    style: { backgroundColor: overlayColor },
  });

  // Thin rule above headline
  elements.push({
    id: `rule_${n}`, type: 'shape',
    x: 340, y: 155, width: 40, height: 2,
    style: { backgroundColor: ruleColor },
  });

  // Headline centered
  elements.push({
    id: `headline_${n}`, type: 'text',
    x: 100, y: 168, width: 520, height: 80,
    content: slide.headline,
    style: { fontSize: 32, fontWeight: 'bold', color: textColor, alignment: 'center', lineHeight: 1.3 },
  });

  // Subheadline
  if (slide.subheadline) {
    elements.push({
      id: `sub_${n}`, type: 'text',
      x: 120, y: 255, width: 480, height: 40,
      content: slide.subheadline,
      style: { fontSize: 15, color: mutedTextColor, alignment: 'center', lineHeight: 1.5 },
    });
  }

  // Counter
  elements.push({
    id: `counter_${n}`, type: 'text',
    x: 720 - 40 - 50, y: 405 - 28 - 14, width: 50, height: 14,
    content: `${n} / ${totalSlides}`,
    style: { fontSize: 11, color: counterTextColor, alignment: 'right' },
  });

  // Use accent color as background (the export converter will handle this)
  return { elements, background: accent, fit: 'ok' };
}
