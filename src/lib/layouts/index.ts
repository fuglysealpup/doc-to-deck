import { Slide, SlideLayout, SlideIntent, Theme } from '@/src/types/deck';
import { LayoutSpec } from '../layoutSpec';
import { FontTier } from './textMeasure';
import { heroLayoutSpec } from './heroLayout';
import { splitLayoutSpec } from './splitLayout';
import { cardsLayoutSpec } from './cardsLayout';
import { listLayoutSpec } from './listLayout';
import { quoteLayoutSpec } from './quoteLayout';
import { timelineLayoutSpec } from './timelineLayout';
import { referenceLayoutSpec } from './referenceLayout';
import { statHeroLayoutSpec } from './statHeroLayout';
import { tableLayoutSpec } from './tableLayout';
import { comparisonMatrixLayoutSpec } from './comparisonMatrixLayout';
import { proConLayoutSpec } from './proConLayout';
import { dividerLayoutSpec } from './dividerLayout';

export type LayoutSpecFn = (slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier) => LayoutSpec;

const layoutSpecMap: Record<string, LayoutSpecFn> = {
  'hero': heroLayoutSpec,
  'split': splitLayoutSpec,
  'cards': cardsLayoutSpec,
  'list': listLayoutSpec,
  'quote': quoteLayoutSpec,
  'timeline': timelineLayoutSpec,
  'reference': referenceLayoutSpec,
  'stat-hero': statHeroLayoutSpec,
  'table': tableLayoutSpec,
  'comparison-matrix': comparisonMatrixLayoutSpec,
  'pro-con': proConLayoutSpec,
  'divider': dividerLayoutSpec,
};

const defaultIntentLayout: Record<SlideIntent, SlideLayout> = {
  title: 'hero',
  context: 'split',
  problem: 'list',
  finding: 'cards',
  insight: 'quote',
  recommendation: 'timeline',
  proof: 'quote',
  exhibit: 'cards',
  structure: 'split',
  closing: 'hero',
};

export function getLayoutSpec(
  slide: Slide, theme: Theme, totalSlides: number, forceTier?: FontTier
): LayoutSpec {
  const layout = slide.layout || defaultIntentLayout[slide.type] || 'list';
  const specFn = layoutSpecMap[layout] || layoutSpecMap['list'];
  return specFn(slide, theme, totalSlides, forceTier);
}
