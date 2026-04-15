import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Slide, Theme } from "@/src/types/deck";
import { themes } from "@/src/themes";
import { getLayoutSpec } from "@/src/lib/layouts";
import { LayoutElement } from "@/src/lib/layoutSpec";
import { checkSlideRendering, fetchSlideThumbnails } from "@/src/lib/slideChecker";
import { remediateSlide } from "@/src/lib/slideRemediation";
import { FontTier } from "@/src/lib/layouts/textMeasure";

interface ExportRequest {
  title: string;
  slides: Slide[];
  theme: string;
}

type RGB = { red: number; green: number; blue: number };
type SlidesRequest = Record<string, unknown>;

const PT = 12700;
function emu(pts: number) { return pts * PT; }

function hexToRgb(hex: string): RGB {
  // Handle rgba strings — extract just the color or return a default
  if (hex.startsWith('rgba')) {
    const match = hex.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return { red: +match[1] / 255, green: +match[2] / 255, blue: +match[3] / 255 };
    return { red: 0.9, green: 0.9, blue: 0.9 };
  }
  const h = hex.replace("#", "");
  if (h.length < 6) return { red: 0.9, green: 0.9, blue: 0.9 };
  return {
    red: parseInt(h.substring(0, 2), 16) / 255,
    green: parseInt(h.substring(2, 4), 16) / 255,
    blue: parseInt(h.substring(4, 6), 16) / 255,
  };
}

function blendRgba(r: number, g: number, b: number, a: number, bgHex: string): RGB {
  const bg = hexToRgb(bgHex);
  return {
    red:   a * (r / 255) + (1 - a) * bg.red,
    green: a * (g / 255) + (1 - a) * bg.green,
    blue:  a * (b / 255) + (1 - a) * bg.blue,
  };
}

function cssColorToRgb(color: string, bgHex: string = '#ffffff'): RGB {
  if (!color) return { red: 0.1, green: 0.1, blue: 0.1 };
  if (color.startsWith('#')) return hexToRgb(color);
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)/);
    if (match) return blendRgba(+match[1], +match[2], +match[3], +match[4], bgHex);
    return { red: 0.5, green: 0.5, blue: 0.5 };
  }
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return { red: +match[1] / 255, green: +match[2] / 255, blue: +match[3] / 255 };
  }
  return { red: 0.1, green: 0.1, blue: 0.1 };
}

// ─── SPEC → GOOGLE SLIDES CONVERTERS ───

function specTextToSlides(el: LayoutElement, slideId: string, slideBg: string = '#ffffff'): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const color = cssColorToRgb(el.style.color || '#1a1a1a', slideBg);
  const text = el.content || '';
  if (!text) return reqs;

  // If backgroundColor, create a shape with text inside (badge pill)
  if (el.style.backgroundColor && el.style.borderRadius) {
    reqs.push({
      createShape: {
        objectId: el.id, shapeType: "ROUND_RECTANGLE",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: emu(el.width), unit: "EMU" }, height: { magnitude: emu(el.height), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(el.x), translateY: emu(el.y), unit: "EMU" },
        },
      },
    });
    const bgRgb = cssColorToRgb(el.style.backgroundColor, slideBg);
    reqs.push({
      updateShapeProperties: {
        objectId: el.id,
        shapeProperties: {
          shapeBackgroundFill: { solidFill: { color: { rgbColor: bgRgb } } },
          outline: { propertyState: "NOT_RENDERED" },
        },
        fields: "shapeBackgroundFill.solidFill.color,outline",
      },
    });
  } else {
    reqs.push({
      createShape: {
        objectId: el.id, shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: emu(el.width), unit: "EMU" }, height: { magnitude: emu(el.height), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(el.x), translateY: emu(el.y), unit: "EMU" },
        },
      },
    });
  }

  reqs.push({ insertText: { objectId: el.id, text, insertionIndex: 0 } });

  // Base text style
  const styleFields: string[] = ['fontSize', 'foregroundColor'];
  const style: Record<string, unknown> = {
    fontSize: { magnitude: el.style.fontSize || 13, unit: "PT" },
    foregroundColor: { opaqueColor: { rgbColor: color } },
  };
  if (el.style.fontWeight === 'bold') {
    style.bold = true;
    styleFields.push('bold');
  }

  reqs.push({
    updateTextStyle: {
      objectId: el.id, style, textRange: { type: "ALL" }, fields: styleFields.join(','),
    },
  });

  // Alignment
  if (el.style.alignment) {
    reqs.push({
      updateParagraphStyle: {
        objectId: el.id,
        style: { alignment: el.style.alignment === 'center' ? 'CENTER' : el.style.alignment === 'right' ? 'END' : 'START' },
        textRange: { type: "ALL" },
        fields: "alignment",
      },
    });
  }

  // Line spacing
  if (el.style.lineHeight && el.style.lineHeight > 1) {
    reqs.push({
      updateParagraphStyle: {
        objectId: el.id,
        style: { lineSpacing: Math.round(el.style.lineHeight * 100) },
        textRange: { type: "ALL" },
        fields: "lineSpacing",
      },
    });
  }

  // Rich content: bold lead-in portions
  if (el.richContent) {
    let offset = 0;
    for (const part of el.richContent) {
      if (part.bold) {
        reqs.push({
          updateTextStyle: {
            objectId: el.id,
            style: { bold: true, foregroundColor: { opaqueColor: { rgbColor: color } } },
            textRange: { type: "FIXED_RANGE", startIndex: offset, endIndex: offset + part.bold.length },
            fields: "bold,foregroundColor",
          },
        });
        offset += part.bold.length;
      }
      if (part.regular) {
        offset += part.regular.length;
      }
    }
  }

  return reqs;
}

function specShapeToSlides(el: LayoutElement, slideId: string, slideBg: string = '#ffffff'): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const shapeType = (el.style.borderRadius && el.style.borderRadius > 0) ? "ROUND_RECTANGLE" : "RECTANGLE";
  const bgColor = el.style.backgroundColor ? cssColorToRgb(el.style.backgroundColor, slideBg) : null;

  reqs.push({
    createShape: {
      objectId: el.id, shapeType,
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(el.width), unit: "EMU" }, height: { magnitude: emu(el.height), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(el.x), translateY: emu(el.y), unit: "EMU" },
      },
    },
  });

  if (bgColor) {
    reqs.push({
      updateShapeProperties: {
        objectId: el.id,
        shapeProperties: {
          shapeBackgroundFill: { solidFill: { color: { rgbColor: bgColor } } },
          outline: { propertyState: "NOT_RENDERED" },
        },
        fields: "shapeBackgroundFill.solidFill.color,outline",
      },
    });
  }

  // Render children (text inside cards)
  if (el.children) {
    for (const child of el.children) {
      if (child.type === 'text') {
        reqs.push(...specTextToSlides(child, slideId, slideBg));
      }
    }
  }

  return reqs;
}

function specTableToSlides(el: LayoutElement, slideId: string): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const td = el.tableData;
  if (!td) return reqs;

  const numCols = td.headers.length;
  const numRows = td.rows.length + 1;

  reqs.push({
    createTable: {
      objectId: el.id,
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(el.width), unit: "EMU" }, height: { magnitude: emu(el.height), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(el.x), translateY: emu(el.y), unit: "EMU" },
      },
      rows: numRows,
      columns: numCols,
    },
  });

  // Header row
  const hs = td.headerStyle;
  td.headers.forEach((h, ci) => {
    if (h) {
      reqs.push({ insertText: { objectId: el.id, text: h, cellLocation: { rowIndex: 0, columnIndex: ci }, insertionIndex: 0 } });
      reqs.push({
        updateTextStyle: {
          objectId: el.id,
          style: {
            bold: hs?.bold ?? true,
            fontSize: { magnitude: 9, unit: "PT" },
            foregroundColor: { opaqueColor: { rgbColor: cssColorToRgb(hs?.color || '#ffffff') } },
          },
          textRange: { type: "ALL" },
          cellLocation: { rowIndex: 0, columnIndex: ci },
          fields: "bold,fontSize,foregroundColor",
        },
      });
      reqs.push({
        updateParagraphStyle: {
          objectId: el.id,
          style: { alignment: ci === 0 ? "START" : "CENTER" },
          textRange: { type: "ALL" },
          cellLocation: { rowIndex: 0, columnIndex: ci },
          fields: "alignment",
        },
      });
    }
    if (hs?.backgroundColor) {
      reqs.push({
        updateTableCellProperties: {
          objectId: el.id,
          tableRange: { location: { rowIndex: 0, columnIndex: ci }, rowSpan: 1, columnSpan: 1 },
          tableCellProperties: { tableCellBackgroundFill: { solidFill: { color: { rgbColor: cssColorToRgb(hs.backgroundColor) } } } },
          fields: "tableCellBackgroundFill.solidFill.color",
        },
      });
    }
  });

  // Data rows
  td.rows.forEach((row, ri) => {
    const rowIdx = ri + 1;
    row.cells.forEach((cell, ci) => {
      if (cell.content) {
        reqs.push({ insertText: { objectId: el.id, text: cell.content, cellLocation: { rowIndex: rowIdx, columnIndex: ci }, insertionIndex: 0 } });
        const cellColor = cell.color ? cssColorToRgb(cell.color) : cssColorToRgb('#333333');
        const fields = cell.bold ? 'bold,fontSize,foregroundColor' : 'fontSize,foregroundColor';
        reqs.push({
          updateTextStyle: {
            objectId: el.id,
            style: {
              ...(cell.bold ? { bold: true } : {}),
              fontSize: { magnitude: 10, unit: "PT" },
              foregroundColor: { opaqueColor: { rgbColor: cellColor } },
            },
            textRange: { type: "ALL" },
            cellLocation: { rowIndex: rowIdx, columnIndex: ci },
            fields,
          },
        });
        if (cell.alignment) {
          reqs.push({
            updateParagraphStyle: {
              objectId: el.id,
              style: { alignment: cell.alignment === 'center' ? 'CENTER' : cell.alignment === 'right' ? 'END' : 'START' },
              textRange: { type: "ALL" },
              cellLocation: { rowIndex: rowIdx, columnIndex: ci },
              fields: "alignment",
            },
          });
        }
      }
    });

    // Row background tint
    if (row.backgroundColor) {
      for (let ci = 0; ci < numCols; ci++) {
        reqs.push({
          updateTableCellProperties: {
            objectId: el.id,
            tableRange: { location: { rowIndex: rowIdx, columnIndex: ci }, rowSpan: 1, columnSpan: 1 },
            tableCellProperties: { tableCellBackgroundFill: { solidFill: { color: { rgbColor: cssColorToRgb(row.backgroundColor) } } } },
            fields: "tableCellBackgroundFill.solidFill.color",
          },
        });
      }
    }
  });

  return reqs;
}

// ─── CONTENT CONDENSATION ───

function getMaxBulletsForLayout(layout: string): number {
  switch (layout) {
    case 'split': return 4;
    case 'cards': return 4;
    case 'stat-hero': return 3;
    case 'pro-con': return 8;
    case 'list': return 6;
    case 'timeline': return 5;
    case 'table': return 8;
    case 'comparison-matrix': return 6;
    default: return 5;
  }
}

const anthropic = new Anthropic();

async function condenseSlideContent(slide: Slide, theme: Theme, totalSlides: number): Promise<Slide> {
  const spec = getLayoutSpec(slide, theme, totalSlides);
  if (spec.fit !== 'overflow') return slide;

  const layout = slide.layout || 'list';
  const maxBullets = getMaxBulletsForLayout(layout);
  if (slide.bullets.length <= maxBullets) return slide;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a presentation editor. This slide has too much content to fit its layout.

Layout type: ${layout}
Current headline: ${slide.headline}
Current bullets (${slide.bullets.length} items):
${slide.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Condense to ${maxBullets} bullets maximum. Rules:
- Preserve the most important information
- Combine related points into single stronger statements
- Keep each bullet under 80 characters if possible
- Do NOT change the headline
- For PRO:/CON: prefixed bullets, maintain the prefix and keep the ratio balanced
- Maintain the " — " (em dash) format if the original bullets use it

Return ONLY a JSON object: {"bullets": ["bullet 1", "bullet 2", ...]}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return { ...slide, bullets: parsed.bullets };
  } catch {
    return slide; // if condensation fails, use original
  }
}

// ─── MAIN EXPORT HANDLER ───
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("google_access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: ExportRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { title, slides, theme: themeName } = body;
  if (!slides || slides.length === 0) {
    return NextResponse.json({ error: "No slides to export." }, { status: 400 });
  }

  const activeTheme = themes[themeName] || themes.editorial;

  try {
    const createRes = await fetch("https://slides.googleapis.com/v1/presentations", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (createRes.status === 401) return NextResponse.json({ error: "token_expired" }, { status: 401 });
    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ error: `Failed to create presentation: ${err}` }, { status: 502 });
    }

    const presentation = await createRes.json();
    const presentationId = presentation.presentationId;
    const defaultSlideId = presentation.slides?.[0]?.objectId;
    const requests: SlidesRequest[] = [];

    // Condense overflowing slides before building specs
    const processedSlides = await Promise.all(
      slides.map(slide => condenseSlideContent(slide, activeTheme, slides.length))
    );

    for (const slide of processedSlides) {
      const slideId = `slide_${slide.slide_number}`;
      const spec = getLayoutSpec(slide, activeTheme, processedSlides.length);

      // Create slide
      requests.push({ createSlide: { objectId: slideId, slideLayoutReference: { predefinedLayout: "BLANK" } } });

      // Set background from spec
      requests.push({
        updatePageProperties: {
          objectId: slideId,
          pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: hexToRgb(spec.background) } } } },
          fields: "pageBackgroundFill.solidFill.color",
        },
      });

      // Convert each element
      for (const element of spec.elements) {
        switch (element.type) {
          case 'text':
            requests.push(...specTextToSlides(element, slideId, spec.background));
            break;
          case 'shape':
            requests.push(...specShapeToSlides(element, slideId, spec.background));
            break;
          case 'table':
            requests.push(...specTableToSlides(element, slideId));
            break;
        }
      }
    }

    if (defaultSlideId) {
      requests.push({ deleteObject: { objectId: defaultSlideId } });
    }

    const batchRes = await fetch(
      `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
      { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ requests }) }
    );

    if (batchRes.status === 401) return NextResponse.json({ error: "token_expired" }, { status: 401 });
    if (!batchRes.ok) {
      const err = await batchRes.text();
      return NextResponse.json({ error: `Failed to build slides: ${err}` }, { status: 502 });
    }

    // ─── VISUAL QUALITY CHECK LOOP (max 2 iterations) ───
    let currentSlides = [...processedSlides];
    const MAX_CHECK_ITERATIONS = 2;

    for (let iteration = 0; iteration < MAX_CHECK_ITERATIONS; iteration++) {
      try {
        const thumbnails = await fetchSlideThumbnails(presentationId, accessToken);
        if (thumbnails.length === 0) break;

        const checkResults = await Promise.all(
          thumbnails.map((thumb, i) => {
            const slide = currentSlides[i];
            if (!slide) return Promise.resolve({ slideIndex: i, pass: true, issues: [] });
            return checkSlideRendering(thumb.imageBase64, i, {
              headline: slide.headline,
              bulletCount: slide.bullets.length,
              layout: slide.layout || 'list',
            });
          })
        );

        const failedSlides = checkResults.filter(r => !r.pass);

        // Log check results
        if (failedSlides.length > 0) {
          console.log(`[SlideChecker] Iteration ${iteration + 1}: ${failedSlides.length}/${currentSlides.length} slides failed`);
          for (const f of failedSlides) {
            const slide = currentSlides[f.slideIndex];
            for (const issue of f.issues) {
              console.log(`[SlideChecker] Slide ${f.slideIndex + 1} (${slide?.layout || slide?.type}): [${issue.severity}] ${issue.description} → ${issue.suggestedFix}`);
            }
          }
        } else {
          console.log(`[SlideChecker] Iteration ${iteration + 1}: All slides passed`);
        }

        if (failedSlides.length === 0) break;
        if (iteration === MAX_CHECK_ITERATIONS - 1) {
          console.log(`[SlideChecker] Max iterations reached, accepting remaining issues`);
          break;
        }

        // Remediate and re-export failed slides
        const reExportRequests: SlidesRequest[] = [];

        for (const failed of failedSlides) {
          const slide = currentSlides[failed.slideIndex];
          if (!slide) continue;

          const remediated = await remediateSlide(slide, failed.issues);
          currentSlides[failed.slideIndex] = remediated.slide;

          const oldSlideId = `slide_${slide.slide_number}`;
          const newSlideId = `slide_${slide.slide_number}_v${iteration + 1}`;
          const ft = remediated.forceTier as FontTier | undefined;

          // Delete old slide
          reExportRequests.push({ deleteObject: { objectId: oldSlideId } });

          // Create new slide at the same position
          reExportRequests.push({
            createSlide: {
              objectId: newSlideId,
              insertionIndex: failed.slideIndex,
              slideLayoutReference: { predefinedLayout: "BLANK" },
            },
          });

          const spec = getLayoutSpec(remediated.slide, activeTheme, currentSlides.length, ft || undefined);

          reExportRequests.push({
            updatePageProperties: {
              objectId: newSlideId,
              pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: hexToRgb(spec.background) } } } },
              fields: "pageBackgroundFill.solidFill.color",
            },
          });

          for (const element of spec.elements) {
            // Prefix element IDs with version to avoid collisions
            const vElement = { ...element, id: `${element.id}_v${iteration + 1}` };
            if (vElement.children) {
              vElement.children = vElement.children.map(c => ({ ...c, id: `${c.id}_v${iteration + 1}` }));
            }
            switch (vElement.type) {
              case 'text': reExportRequests.push(...specTextToSlides(vElement, newSlideId, spec.background)); break;
              case 'shape': reExportRequests.push(...specShapeToSlides(vElement, newSlideId, spec.background)); break;
              case 'table': reExportRequests.push(...specTableToSlides(vElement, newSlideId)); break;
            }
          }
        }

        if (reExportRequests.length > 0) {
          const reRes = await fetch(
            `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
            { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ requests: reExportRequests }) }
          );
          if (!reRes.ok) break; // If re-export fails, accept what we have
        }
      } catch {
        break; // If any check step fails, accept current state
      }
    }

    return NextResponse.json({ url: `https://docs.google.com/presentation/d/${presentationId}/edit` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Google Slides export error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
