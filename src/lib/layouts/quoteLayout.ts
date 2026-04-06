import { Slide, Theme } from '@/src/types/deck';
import { LayoutSpec, LayoutElement, CONTENT_W, MARGIN_L } from '../layoutSpec';

// Matches QuoteLayout.tsx: padding 56px 80px, centered, maxWidth 85%
function isColorDark(hex: string): boolean {
  const h = hex.replace('#', '');
  return parseInt(h.substring(0, 2), 16) + parseInt(h.substring(2, 4), 16) + parseInt(h.substring(4, 6), 16) < 384;
}

export function quoteLayoutSpec(slide: Slide, theme: Theme, totalSlides: number): LayoutSpec {
  const n = slide.slide_number;
  const bg = theme.backgrounds[slide.type];
  const accent = theme.accents[slide.type];
  const badge = theme.badges[slide.type];
  const isDark = theme.decorative.useDarkSlides && slide.type === 'insight';
  const headColor = isDark ? '#ffffff' : theme.typography.body;
  const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : theme.typography.muted;
  const counterColor = isDark ? 'rgba(255,255,255,0.3)' : theme.typography.muted;
  const elements: LayoutElement[] = [];
  const contentW = 520;
  const contentX = (720 - contentW) / 2;

  // Badge centered
  elements.push({
    id: `badge_${n}`, type: 'text',
    x: MARGIN_L, y: 60, width: CONTENT_W, height: 20,
    content: slide.type.toUpperCase(),
    style: { fontSize: 10, fontWeight: 'bold', color: badge.color, backgroundColor: badge.background, alignment: 'center', textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10 },
  });

  // Headline centered, serif feel
  elements.push({
    id: `headline_${n}`, type: 'text',
    x: contentX, y: 100, width: contentW, height: 140,
    content: slide.headline,
    style: { fontSize: isDark ? 22 : 24, color: headColor, alignment: 'center', lineHeight: 1.5 },
  });

  // Subheadline
  if (slide.subheadline) {
    elements.push({
      id: `sub_${n}`, type: 'text',
      x: contentX + 20, y: 255, width: contentW - 40, height: 40,
      content: slide.subheadline,
      style: { fontSize: 14, color: mutedColor, alignment: 'center', lineHeight: 1.5 },
    });
  }

  // Bullets as horizontal keyword tags (max 3)
  if (slide.bullets.length > 0) {
    const tagsText = slide.bullets.slice(0, 3).join('  ·  ');
    elements.push({
      id: `tags_${n}`, type: 'text',
      x: MARGIN_L, y: 320, width: CONTENT_W, height: 24,
      content: tagsText,
      style: { fontSize: 11, color: mutedColor, alignment: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' },
    });
  }

  // Counter
  elements.push({
    id: `counter_${n}`, type: 'text',
    x: 720 - 48 - 50, y: 405 - 32 - 14, width: 50, height: 14,
    content: `${n} / ${totalSlides}`,
    style: { fontSize: 11, color: counterColor, alignment: 'right', opacity: 0.6 },
  });

  return { elements, background: bg };
}
