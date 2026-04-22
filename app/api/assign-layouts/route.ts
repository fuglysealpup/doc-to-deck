import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { Slide } from "@/src/types/deck";

const SYSTEM_PROMPT = `You are a presentation design expert. Given a set of slides with their content and narrative intent, assign the optimal visual layout for each slide.

Your job has two passes:
- PASS 1: Assign each slide the layout that best fits its content.
- PASS 2: Review the full sequence and fix adjacent repetition.

Both passes are described below.

---

## PASS 1: Content-driven assignment

CRITICAL: Match CONTENT to the right CONTAINER. Do not simply assign the layout that the intent type would normally receive. Read the actual content — the headline, bullet count, and the opening words of each bullet — and pick the layout that makes that specific content look best.

Available layouts:

**hero** — Large headline anchored at bottom, minimal content.
USE WHEN: 0-1 bullets and one powerful statement. Opening titles, closing asks, dramatic single-message moments.
DO NOT USE WHEN: 3+ bullets with substantive content.

**split** — Two columns: headline left, card-style bullets right.
USE WHEN: 2-4 supporting points that each deserve visual weight. The headline frames the argument, the bullets prove it.
DO NOT USE WHEN: 5+ bullets (too cramped) or 0-1 bullets (empty right column).

**list** — Single column with headline and vertical bullet list.
USE WHEN: Items that should be read top to bottom in sequence — problems, requirements, criteria, steps without time markers.
DO NOT USE WHEN: Bullets are peers that should be compared side by side.

**cards** — Headline with bullets as a grid of equal-weight cards.
USE WHEN: 3-5 items have roughly equal importance and the audience should scan and compare them. Findings, features, options.
DO NOT USE WHEN: One item is more important than the others, or the items form a sequence.

**quote** — Centered, large typographic headline. Bullets appear as a subtle horizontal tagline.
USE WHEN: ONE dominant message and 0-3 very short bullets (under 5 words each) that serve as tags or labels. Key insights, bold thesis statements.
DO NOT USE WHEN: Bullets are full sentences, contain data points, or describe distinct mechanisms.

**timeline** — Headline with sequential rows, each with a time/phase label.
USE WHEN: Content has explicit temporal markers — phases, months, quarters, near/mid/long term. Roadmaps, phased plans.
DO NOT USE WHEN: Content is not sequential or has no time markers.

**reference** — Clean list with left-border accent per item.
USE WHEN: Methodology details, source citations, structured reference information. Content that should feel authoritative and documented.
DO NOT USE WHEN: Content is making an argument or driving toward action.

**stat-hero** — 2-3 large statistics as big numbers with small descriptors.
USE WHEN: 2-3 bullets where each bullet_preview starts with a number, percentage, dollar amount, or metric followed by " — ". The slide's purpose is to make stats memorable.
DO NOT USE WHEN: Bullets are full sentences without a clear stat lead-in, or there are more than 3 bullets.

**table** — Structured two-column comparison with rows.
USE WHEN: Content compares attributes, lists feature/description pairs, or presents structured key-value data. Each bullet has a label and a corresponding detail.
DO NOT USE WHEN: Items don't have a consistent label-detail structure.

**comparison-matrix** — Multi-column grid with entities as rows and attributes as columns.
USE WHEN: Bullets use pipe-delimited format ("Entity | Attr1 | Attr2 | Attr3") with a header row. 3+ entities compared across 3+ shared attributes.
DO NOT USE WHEN: Data is two-column (use table), or bullets are not pipe-delimited.

**pro-con** — Two-column balanced assessment: benefits left, challenges right.
USE WHEN: Bullets are prefixed with "PRO:" or "CON:". Trade-offs, pros vs. cons, benefits vs. risks.
DO NOT USE WHEN: Content is not a balanced assessment, or all bullets are positives.

**divider** — Bold section break slide with centered headline only. No bullets.
USE WHEN: 0 bullets, serves as a section transition. Headline names a section (1-5 words), not an argument.
DO NOT USE WHEN: Slide has bullets or substantive content.

PASS 1 DECISION RULES:

1. Count bullets and read bullet_previews. This is the strongest signal:
   - 0-1 bullets → hero or quote
   - 2-4 bullets with full sentences → split or cards
   - 3-5 short-phrase bullets → cards
   - 4+ bullets in sequence → list or timeline
   - Any bullets with temporal markers → timeline

2. If 2-3 bullet_previews each start with a number, percentage, dollar amount, or metric followed by " — ", assign stat-hero.

3. If bullet_previews use pipe-delimited format with a header row, assign comparison-matrix.

4. If bullet_previews are prefixed with "PRO:" or "CON:", assign pro-con.

5. If speaker_note_preview contains "[viz: stat-hero]", assign stat-hero.
   If it contains "[viz: connected-stat-chain]", assign stat-hero.
   If it contains "[viz: positioning-matrix]", assign comparison-matrix.
   These hints were placed deliberately — honor them.

6. "proof" intent does NOT automatically mean "quote." A proof slide with three distinct evidence points should be split or cards.

7. "finding" intent does NOT automatically mean "cards." A finding with one dramatic data point should be quote. A finding with dense research citations should be reference.

8. Assign divider to slides with type "structure" that have 0 bullets. The title slide (slide 1) always uses hero.

---

## PASS 2: Sequence review — fix adjacent repetition

After completing Pass 1, read your assignments top to bottom as a sequence.

For every pair of adjacent slides that share the same layout, ask:
- Is there another layout that fits this slide's content equally well?
- Would that alternative create visual contrast with the neighboring slide?

If yes to both: reassign the slide to the alternative layout.
If no valid alternative exists: keep the original. Never sacrifice content fit for variety.

WHAT "EQUALLY WELL" MEANS:
An alternative layout is valid if it satisfies the same bullet count and content shape rules from Pass 1. For example:
- A slide with 3 full-sentence bullets can validly use split, cards, or list — any of these fit.
- A slide with 4 temporal bullets can only validly use timeline — do not reassign it for variety.
- A slide with 1 bullet can validly use hero or quote — pick the one that contrasts with its neighbor.

WHAT CONTRAST MEANS:
Adjacent slides contrast when they differ on at least one of these dimensions:
- Density: an open layout (hero, quote, divider, stat-hero) next to a dense layout (list, cards, table, comparison-matrix)
- Orientation: a vertical layout (list, timeline) next to a two-column layout (split, pro-con, cards)
- Scale: a large-type layout (quote, stat-hero, hero) next to a body-text layout (list, reference, table)

PASS 2 RULES:
- Title slide (slide 1) and closing slide (last slide) are always hero — do not reassign them.
- A divider slide creates contrast with anything — never reassign a divider.
- If three or more consecutive slides share the same layout and no valid alternative exists for any of them, that is acceptable — content fit takes priority.

---

Return a JSON array with one object per slide:

[
  { "slide_number": 1, "layout": "hero" },
  { "slide_number": 2, "layout": "split" }
]

Return ONLY the JSON array. No preamble, no explanation, no markdown fences.`;

const client = new Anthropic();
// Requires OPENAI_API_KEY environment variable in Vercel settings
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

export async function POST(request: NextRequest) {
  try {
    const { slides, model = "claude" } = (await request.json()) as { slides: Slide[]; model?: string };

    if (!slides || slides.length === 0) {
      return NextResponse.json({ error: "No slides provided." }, { status: 400 });
    }

    const slideSummary = slides.map((s) => ({
      slide_number: s.slide_number,
      type: s.type,
      headline: s.headline,
      bullet_count: s.bullets.length,
      bullet_previews: s.bullets.map((b) => b.slice(0, 40)),
      speaker_note_preview: (s.speaker_note || '').slice(0, 100),
    }));

    let rawText: string;

    if (model === "openai") {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 1000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(slideSummary) },
        ],
      });
      rawText = response.choices[0]?.message?.content || "[]";
    } else {
      const modelString = model === "opus" ? "claude-opus-4-7" : "claude-sonnet-4-6";
      const message = await client.messages.create({
        model: modelString,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: JSON.stringify(slideSummary) }],
      });
      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        return NextResponse.json({ error: "No text response." }, { status: 502 });
      }
      rawText = textBlock.text;
    }

    let cleanJson = rawText.replace(/```json|```/g, "").trim();
    cleanJson = cleanJson.replace(/,\s*([}\]])/g, '$1');
    const layouts = JSON.parse(cleanJson);
    return NextResponse.json({ layouts });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Layout assignment failed.";
    console.error("Layout assignment error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
