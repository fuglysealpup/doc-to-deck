import { SlideIntent, SlideLayout, SlideProps } from '@/src/types/deck';
import HeroLayout from '@/src/components/layouts/HeroLayout';
import SplitLayout from '@/src/components/layouts/SplitLayout';
import ListLayout from '@/src/components/layouts/ListLayout';
import CardsLayout from '@/src/components/layouts/CardsLayout';
import QuoteLayout from '@/src/components/layouts/QuoteLayout';
import TimelineLayout from '@/src/components/layouts/TimelineLayout';
import ReferenceLayout from '@/src/components/layouts/ReferenceLayout';
import React from 'react';

export const intentLayoutMap: Record<SlideIntent, React.ComponentType<SlideProps>> = {
  title: HeroLayout,
  context: SplitLayout,
  problem: ListLayout,
  finding: CardsLayout,
  insight: QuoteLayout,
  recommendation: TimelineLayout,
  proof: QuoteLayout,
  exhibit: CardsLayout,
  structure: SplitLayout,
  closing: HeroLayout,
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

export const layoutComponentMap: Record<SlideLayout, React.ComponentType<SlideProps>> = {
  hero: HeroLayout,
  split: SplitLayout,
  list: ListLayout,
  cards: CardsLayout,
  quote: QuoteLayout,
  timeline: TimelineLayout,
  reference: ReferenceLayout,
};

export function getLayoutForSlide(slide: { type: SlideIntent; layout?: SlideLayout }): SlideLayout {
  return slide.layout || defaultIntentLayout[slide.type];
}
