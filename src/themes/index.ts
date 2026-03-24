import { Theme } from '@/src/types/deck';
import { editorial } from './editorial';
import { corporate } from './corporate';
import { minimal } from './minimal';

export const themes: Record<string, Theme> = {
  editorial,
  corporate,
  minimal,
};

export { editorial, corporate, minimal };
