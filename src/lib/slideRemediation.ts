import Anthropic from '@anthropic-ai/sdk';
import { Slide, Theme } from '@/src/types/deck';
import { SlideIssue } from './slideChecker';

export interface RemediatedSlide {
  slide: Slide;
  forceTier: 'standard' | 'compact' | null;
}

const client = new Anthropic();

export async function remediateSlide(
  slide: Slide,
  issues: SlideIssue[],
): Promise<RemediatedSlide> {
  const hasMajor = issues.some(i => i.suggestedFix === 'condense_content');
  const hasMinor = issues.some(i => i.suggestedFix === 'compact_font');

  if (hasMajor) {
    const condensed = await condenseContent(slide);
    return { slide: condensed, forceTier: 'compact' };
  }

  if (hasMinor) {
    return { slide, forceTier: 'compact' };
  }

  return { slide, forceTier: null };
}

function getMaxBullets(layout: string): number {
  switch (layout) {
    case 'split': return 4;
    case 'cards': return 4;
    case 'stat-hero': return 3;
    case 'pro-con': return 8;
    case 'list': return 5;
    case 'timeline': return 4;
    case 'table': return 6;
    case 'comparison-matrix': return 5;
    default: return 4;
  }
}

async function condenseContent(slide: Slide): Promise<Slide> {
  const maxBullets = getMaxBullets(slide.layout || 'list');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a presentation editor. This slide has too much content to fit its layout. Condense it.

Layout type: ${slide.layout}
Headline: ${slide.headline}
Subheadline: ${slide.subheadline}
Current bullets (${slide.bullets.length} items):
${slide.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Rules:
- Maximum ${maxBullets} bullets
- Each bullet must be under 60 characters
- Preserve the most important information
- Combine related points into single stronger statements
- For PRO:/CON: prefixed bullets, maintain the prefix and keep the ratio balanced
- Keep the headline and subheadline unchanged unless the headline exceeds 50 characters
- Maintain the " — " (em dash) format if the original bullets use it

Return ONLY a JSON object:
{
  "headline": "original or shortened headline",
  "subheadline": "original subheadline",
  "bullets": ["bullet 1", "bullet 2", ...]
}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      ...slide,
      headline: parsed.headline || slide.headline,
      subheadline: parsed.subheadline ?? slide.subheadline,
      bullets: parsed.bullets || slide.bullets,
    };
  } catch {
    return slide;
  }
}
