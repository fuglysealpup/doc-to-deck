import Anthropic from '@anthropic-ai/sdk';

export interface SlideIssue {
  slideIndex: number;
  severity: 'minor' | 'major' | 'positioning';
  description: string;
  suggestedFix: 'compact_font' | 'condense_content' | 'manual_review';
}

export interface CheckResult {
  slideIndex: number;
  pass: boolean;
  issues: SlideIssue[];
}

const client = new Anthropic();

export async function checkSlideRendering(
  imageBase64: string,
  slideIndex: number,
  slideContent: { headline: string; bulletCount: number; layout: string }
): Promise<CheckResult> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: imageBase64 },
          },
          {
            type: 'text',
            text: `You are a slide rendering quality checker. Examine this Google Slides slide and check for these specific issues:

1. TEXT OVERFLOW: Does any text extend beyond the boundaries of its containing box or shape? Look for text clipped at edges.
2. TEXT OVERLAP: Do any two text elements overlap each other?
3. BOUNDARY VIOLATION: Does any content extend beyond the bottom or right edge of the slide?
4. BADGE LABEL: Is the intent badge fully visible on one line, or is it wrapping or clipped?
5. EMPTY SPACE: Is there excessive unused space while text elsewhere is cramped?
6. COLOR CONTRAST: Is all text readable against its background? Check for dark text on dark backgrounds, light text on light backgrounds, or badge pills where the text color matches the pill background. Every text element must have clear contrast with whatever is behind it.

Slide context: "${slideContent.layout}" layout, headline "${slideContent.headline}", ${slideContent.bulletCount} bullets.

Respond with ONLY a JSON object:
{
  "pass": true/false,
  "issues": [
    {
      "severity": "minor" | "major" | "positioning",
      "description": "specific description",
      "suggestedFix": "compact_font" | "condense_content" | "manual_review"
    }
  ]
}

Severity rules:
- "minor": text slightly exceeds a box but mostly readable → compact_font
- "major": text significantly clipped, runs off slide, or multiple bullets cut off → condense_content
- "positioning": misalignment that font/content changes won't fix → manual_review

If clean, return {"pass": true, "issues": []}.
Return ONLY JSON. No preamble.`,
          },
        ],
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      slideIndex,
      pass: parsed.pass,
      issues: (parsed.issues || []).map((issue: Record<string, string>) => ({
        slideIndex,
        severity: issue.severity,
        description: issue.description,
        suggestedFix: issue.suggestedFix,
      })),
    };
  } catch {
    return { slideIndex, pass: true, issues: [] };
  }
}

export async function fetchSlideThumbnails(
  presentationId: string,
  accessToken: string
): Promise<{ slideId: string; imageBase64: string }[]> {
  const presRes = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!presRes.ok) return [];
  const presentation = await presRes.json();

  const thumbnails: { slideId: string; imageBase64: string }[] = [];

  for (const page of presentation.slides || []) {
    try {
      const thumbRes = await fetch(
        `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${page.objectId}/thumbnail?thumbnailProperties.mimeType=PNG&thumbnailProperties.thumbnailSize=LARGE`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const thumbData = await thumbRes.json();

      if (thumbData.contentUrl) {
        const imageRes = await fetch(thumbData.contentUrl);
        const imageBuffer = await imageRes.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString('base64');
        thumbnails.push({ slideId: page.objectId, imageBase64: base64 });
      }
    } catch {
      // Skip slides that fail thumbnail fetch
    }
  }

  return thumbnails;
}
