import { Slide, Theme } from '@/src/types/deck';
import { LayoutElement, MARGIN_L, MARGIN_T, MARGIN_B, CONTENT_W } from '../layoutSpec';

export function parseBulletLeadIn(bullet: string): { lead: string; rest: string } | null {
  const match = bullet.match(/^(.+?)\s—\s(.+)$/);
  return match ? { lead: match[1], rest: match[2] } : null;
}

// Common header elements: accent line + badge + headline + subheadline
// Returns elements and the Y position where content below should start
export function commonHeader(
  slide: Slide,
  theme: Theme,
): { elements: LayoutElement[]; nextY: number } {
  const n = slide.slide_number;
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const elements: LayoutElement[] = [];

  // Accent line
  elements.push({
    id: `accent_${n}`, type: 'shape',
    x: MARGIN_L, y: MARGIN_T, width: 36, height: 2,
    style: { backgroundColor: accent },
  });

  // Badge
  elements.push({
    id: `badge_${n}`, type: 'text',
    x: MARGIN_L, y: MARGIN_T + 16, width: 80, height: 20,
    content: slide.type.toUpperCase(),
    style: {
      fontSize: 10, fontWeight: 'bold',
      color: badge.color, backgroundColor: badge.background,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      borderRadius: 10,
    },
  });

  // Headline
  elements.push({
    id: `headline_${n}`, type: 'text',
    x: MARGIN_L, y: MARGIN_T + 44, width: CONTENT_W, height: 60,
    content: slide.headline,
    style: {
      fontSize: parseInt(theme.typography.headlineMd) || 22,
      fontWeight: 'bold', color: theme.typography.body, lineHeight: 1.3,
    },
  });

  let nextY = MARGIN_T + 110;

  // Subheadline
  if (slide.subheadline) {
    elements.push({
      id: `sub_${n}`, type: 'text',
      x: MARGIN_L, y: nextY, width: CONTENT_W, height: 36,
      content: slide.subheadline,
      style: { fontSize: 14, color: theme.typography.muted, lineHeight: 1.5 },
    });
    nextY += 44;
  }

  return { elements, nextY };
}

// Counter element at bottom-right
export function counterElement(n: number, totalSlides: number, color: string): LayoutElement {
  return {
    id: `counter_${n}`, type: 'text',
    x: CONTENT_W + MARGIN_L - 50, y: 405 - MARGIN_B - 14, width: 50, height: 14,
    content: `${n} / ${totalSlides}`,
    style: { fontSize: 11, color, alignment: 'right', opacity: 0.6 },
  };
}
