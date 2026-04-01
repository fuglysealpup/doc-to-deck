import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Slide } from "@/src/types/deck";

const SYSTEM_PROMPT = `You are a presentation design expert. Given a set of slides with their content and narrative intent, assign the optimal visual layout for each slide.

Available layouts and when to use each:

**hero** — Content anchored at the bottom of the slide with a large headline. Use for opening titles, closing statements, or any slide where a single bold message needs maximum visual impact. Best when there are few or no bullets.

**split** — Two columns: headline and subheadline on the left, bullet content as cards on the right. Use when the slide has a clear headline plus 2-4 supporting points that benefit from visual separation. Good for context-setting, background information, and structured overviews.

**list** — Single column with headline and a vertical bullet list with accent dots. Use when the slide presents a straightforward list of points that should be scanned sequentially. Good for problems, requirements, or criteria.

**cards** — Headline with bullets rendered as a grid of equal-weight cards. Use when 3-5 items have roughly equal importance and should be compared at a glance. Good for findings, features, or options that are peers, not a hierarchy.

**quote** — Centered, large typographic treatment with minimal supporting text. Use when the slide has one powerful statement or insight that should dominate. Bullets appear as a subtle horizontal tagline. Best for "aha moment" slides, key insights, or dramatic proof points.

**timeline** — Headline with sequential rows, each having a time/phase label and description. Use when the content describes phased plans, roadmaps, sequential steps, or chronological progression. Only works well when bullets contain temporal markers (phases, months, quarters, "near/mid/long term").

**reference** — Clean list with left-border accent per item. Use for methodology details, source citations, structured reference information, or any content that reads as a formal record rather than a persuasive argument.

For each slide, consider:
1. How many bullets does it have, and are they peers or a sequence?
2. Is there one dominant message or multiple equal points?
3. Does the content have temporal/phase structure?
4. Is this a high-impact moment that needs visual drama, or an information-dense slide that needs clarity?

Return a JSON array with one object per slide, containing only slide_number and layout:

[
  { "slide_number": 1, "layout": "hero" },
  { "slide_number": 2, "layout": "split" },
  { "slide_number": 3, "layout": "cards" }
]

Return ONLY the JSON array. No preamble, no explanation, no markdown fences.`;

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { slides } = (await request.json()) as { slides: Slide[] };

    if (!slides || slides.length === 0) {
      return NextResponse.json({ error: "No slides provided." }, { status: 400 });
    }

    const slideSummary = slides.map((s) => ({
      slide_number: s.slide_number,
      type: s.type,
      headline: s.headline,
      subheadline: s.subheadline || "",
      bullet_count: s.bullets.length,
      bullets_preview: s.bullets.slice(0, 3),
    }));

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(slideSummary) }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No text response." }, { status: 502 });
    }

    const layouts = JSON.parse(textBlock.text);
    return NextResponse.json({ layouts });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Layout assignment failed.";
    console.error("Layout assignment error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
