import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert presentation strategist and storyteller. Your job is to transform a content document into a compelling slide deck narrative.

When given a document, you will:

1. IDENTIFY THE CORE STORY
- What is the single most important thing the audience should walk away believing or doing?
- What is the narrative arc? (Problem → Insight → Solution → Action is common but not required)
- What context does the audience need, and what can be cut?

2. STRUCTURE THE SLIDES
- Aim for 6-10 slides unless the content clearly warrants more or fewer
- Every slide must earn its place — no filler
- The opening slide should hook, not just label
- The closing slide should land with conviction, not just summarize

3. RETURN AS JSON in this exact format:
{
  "narrative_summary": "2-3 sentence description of the story arc you identified",
  "audience_note": "who this is pitched to and what they care about",
  "slides": [
    {
      "slide_number": 1,
      "type": "title | context | problem | finding | insight | recommendation | proof | exhibit | structure | closing",
      "headline": "The main message of this slide in one punchy sentence",
      "subheadline": "Supporting context or framing, 1-2 sentences max",
      "bullets": ["key point 1", "key point 2", "key point 3"],
      "speaker_note": "What the presenter should say or emphasize on this slide"
    }
  ]
}

For each slide, ask yourself: what is the audience supposed to think or feel after seeing this? Let that determine the intent. When a recommendation slide spans multiple time periods, structure bullets as near term (0-3 months), mid term (3-12 months), long term (12+ months).

Return ONLY the JSON. No preamble, no explanation, no markdown fences.`;

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { doc } = await request.json();

    if (!doc || typeof doc !== "string" || doc.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide document content." },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: doc }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from API." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(textBlock.text);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Generate API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
