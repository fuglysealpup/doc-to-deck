# doc-to-deck

A Next.js web app that transforms pasted documents into structured, theme-aware slide deck narratives using the Anthropic API.

**Live URL:** https://doc-to-deck.vercel.app

---

## What it does

1. User pastes a document into a textarea
2. Clicks "Generate deck"
3. The app sends the document to an internal API route, which calls Claude (claude-sonnet-4-20250514) with a presentation strategist system prompt
4. Claude analyzes the document, identifies a narrative arc, and returns a structured JSON slide deck
5. The app renders the slides as a visual deck with layout-aware, theme-aware slide cards

---

## Architecture

The app is built around three separated concerns:

### 1. Layouts — how content is arranged

Seven layout components, each purely structural with no hardcoded colors:

| Layout | Used by | Description |
|---|---|---|
| **HeroLayout** | title, closing | Full-bleed background, content bottom-anchored, optional decorative circles |
| **SplitLayout** | context, structure | Two-column with left content and right mini cards, optional accent bar |
| **CardsLayout** | finding, exhibit | Headline with auto-fit card grid |
| **QuoteLayout** | insight, proof | Centered large typographic treatment, serif font, decorative quote marks for proof |
| **TimelineLayout** | recommendation | Sequential rows with auto-parsed time labels (Near term, Q1, Phase N, etc.) |
| **ListLayout** | problem | Styled bullet list with colored dots |
| **ReferenceLayout** | (available for override) | Left-border accent reference items |

### 2. Intent map — which layout each slide type uses

Ten intent-based slide types, each mapped to a layout:

| Intent | Purpose | Layout |
|---|---|---|
| `title` | Opens the deck, sets stakes | HeroLayout |
| `context` | Background the audience needs | SplitLayout |
| `problem` | The tension or challenge | ListLayout |
| `finding` | Data, research, evidence | CardsLayout |
| `insight` | The "so what" of a finding | QuoteLayout |
| `recommendation` | What should be done | TimelineLayout |
| `proof` | Validates a claim — quotes, testimonials | QuoteLayout |
| `exhibit` | Structured reference content | CardsLayout |
| `structure` | How something is organized or connected | SplitLayout |
| `closing` | Final thought with conviction | HeroLayout |

### 3. Themes — visual tokens applied to layouts

Three themes, switchable instantly via a theme switcher UI:

| Theme | Character |
|---|---|
| **Editorial** | Dark hero slides, colored accents per intent, decorative circles, serif quotes |
| **Corporate** | All-light backgrounds, navy/gray palette, no decorative elements, structured and conservative |
| **Minimal** | Black and white, single accent color, maximum whitespace, typography-forward |

Each theme defines: backgrounds, accents, badge styles, typography tokens, and decorative flags — all per intent type. Layout components read exclusively from these tokens.

---

## Tech stack

- **Next.js 14** with App Router
- **TypeScript** in strict mode
- **Tailwind CSS** for utility styling
- **Anthropic SDK** (`@anthropic-ai/sdk`) for Claude API calls
- **Deployed on Vercel** with `ANTHROPIC_API_KEY` as an environment variable

---

## Project structure

```
doc-to-deck/
├── app/
│   ├── api/generate/route.ts      # POST endpoint → Anthropic API
│   ├── globals.css
│   ├── layout.tsx                  # Root layout with ThemeProvider
│   └── page.tsx                    # Main UI — textarea, button, SlideRenderer
├── src/
│   ├── components/
│   │   ├── SlideRenderer.tsx       # Orchestrator — theme switcher + summary + slides
│   │   └── layouts/
│   │       ├── HeroLayout.tsx
│   │       ├── SplitLayout.tsx
│   │       ├── CardsLayout.tsx
│   │       ├── QuoteLayout.tsx
│   │       ├── TimelineLayout.tsx
│   │       ├── ListLayout.tsx
│   │       └── ReferenceLayout.tsx
│   ├── themes/
│   │   ├── index.ts
│   │   ├── editorial.ts
│   │   ├── corporate.ts
│   │   └── minimal.ts
│   ├── lib/
│   │   ├── intentMap.ts            # SlideIntent → Layout component mapping
│   │   └── themeContext.tsx         # React context + useTheme() hook
│   └── types/
│       └── deck.ts                 # All TypeScript interfaces
├── .env.local.example
├── .gitignore
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## API design

**`POST /api/generate`**

Request:
```json
{ "doc": "string — the pasted document content" }
```

Response: structured JSON matching the `DeckResponse` interface:
```json
{
  "narrative_summary": "...",
  "audience_note": "...",
  "slides": [
    {
      "slide_number": 1,
      "type": "title",
      "headline": "...",
      "subheadline": "...",
      "bullets": ["..."],
      "speaker_note": "..."
    }
  ]
}
```

The system prompt instructs Claude to:
- Identify the core story and narrative arc
- Structure 6–10 slides using the 10 intent types
- Determine each slide's intent by what the audience should think or feel
- Structure recommendation bullets by time horizon when applicable
- Return only valid JSON

---

## Running locally

```bash
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm install
npm run dev
```

---

## Deployment

Deployed to Vercel. The `ANTHROPIC_API_KEY` environment variable is configured in Vercel project settings and is not committed to the repository.
