import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement, CONTENT_W } from '../layoutSpec';
import { counterElement } from './common';

// Matches HeroLayout.tsx: padding 56px 64px, content bottom-anchored
const PAD_V = 56;
const PAD_H = 64;
const W = 720 - PAD_H * 2; // 592pt

export function heroLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const isDark = isColorDark(bg);
  const headColor = isDark ? '#ffffff' : theme.typography.body;
  const mutedColor = isDark ? 'rgba(255,255,255,0.6)' : theme.typography.muted;
  const counterColor = isDark ? 'rgba(255,255,255,0.3)' : theme.typography.muted;
  const isClosing = slide.type === 'closing';
  const elements: LayoutElement[] = [];

  if (isClosing) {
    // Badge centered
    elements.push({
      id: `badge_${n}`, type: 'text',
      x: 260, y: 140, width: 200, height: 20,
      content: slide.type.toUpperCase(),
      style: { fontSize: 10, fontWeight: 'bold', color: badge.color, backgroundColor: badge.background, alignment: 'center', textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10 },
    });
    // Headline centered
    elements.push({
      id: `headline_${n}`, type: 'text',
      x: PAD_H, y: 175, width: W, height: 100,
      content: slide.headline,
      style: { fontSize: 30, fontWeight: 'bold', color: headColor, alignment: 'center', lineHeight: 1.2 },
    });
    if (slide.subheadline) {
      elements.push({
        id: `sub_${n}`, type: 'text',
        x: PAD_H, y: 280, width: W, height: 50,
        content: slide.subheadline,
        style: { fontSize: 15, color: mutedColor, alignment: 'center', lineHeight: 1.5 },
      });
    }
  } else {
    // Title: eyebrow + badge + headline bottom-anchored
    elements.push({
      id: `eyebrow_${n}`, type: 'text',
      x: PAD_H, y: 200, width: W, height: 18,
      content: slide.subheadline || 'Presentation',
      style: { fontSize: 11, fontWeight: 'bold', color: accent, textTransform: 'uppercase', letterSpacing: '0.08em' },
    });
    elements.push({
      id: `badge_${n}`, type: 'text',
      x: PAD_H, y: 225, width: 80, height: 20,
      content: slide.type.toUpperCase(),
      style: { fontSize: 10, fontWeight: 'bold', color: badge.color, backgroundColor: badge.background, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10 },
    });
    elements.push({
      id: `headline_${n}`, type: 'text',
      x: PAD_H, y: 255, width: W, height: 120,
      content: slide.headline,
      style: { fontSize: 30, fontWeight: 'bold', color: headColor, lineHeight: 1.2 },
    });
  }

  elements.push({
    ...counterElement(n, totalSlides, counterColor),
    x: W + PAD_H - 50, y: 405 - PAD_V - 14,
  });

  return { elements, background: bg };
}

function isColorDark(hex: string): boolean {
  const h = hex.replace('#', '');
  return parseInt(h.substring(0, 2), 16) + parseInt(h.substring(2, 4), 16) + parseInt(h.substring(4, 6), 16) < 384;
}
