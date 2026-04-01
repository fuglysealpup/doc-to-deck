export type SlideIntent =
  | 'title'
  | 'context'
  | 'problem'
  | 'finding'
  | 'insight'
  | 'recommendation'
  | 'proof'
  | 'exhibit'
  | 'structure'
  | 'closing';

export interface Slide {
  slide_number: number;
  type: SlideIntent;
  headline: string;
  subheadline: string;
  bullets: string[];
  speaker_note: string;
}

export interface DeckResponse {
  document_type?: string;
  narrative_summary: string;
  audience_note: string;
  slides: Slide[];
}

export interface SlideProps {
  slide: Slide;
  theme: Theme;
  totalSlides: number;
}

export interface Theme {
  name: string;
  backgrounds: Record<SlideIntent, string>;
  accents: Record<SlideIntent, string>;
  badges: Record<SlideIntent, { background: string; color: string }>;
  typography: {
    headlineLg: string;
    headlineMd: string;
    body: string;
    muted: string;
    eyebrow: string;
    fontFamily: string;
  };
  decorative: {
    useDarkSlides: boolean;
    useDecoCircles: boolean;
    accentBarWidth: string;
    cardBackground: string;
    cardBorder: string;
  };
}
