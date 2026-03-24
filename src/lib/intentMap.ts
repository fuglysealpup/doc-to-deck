import { SlideIntent, SlideProps } from '@/src/types/deck';
import HeroLayout from '@/src/components/layouts/HeroLayout';
import SplitLayout from '@/src/components/layouts/SplitLayout';
import ListLayout from '@/src/components/layouts/ListLayout';
import CardsLayout from '@/src/components/layouts/CardsLayout';
import QuoteLayout from '@/src/components/layouts/QuoteLayout';
import TimelineLayout from '@/src/components/layouts/TimelineLayout';
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
