import { NextRequest, NextResponse } from "next/server";
import { Slide, SlideIntent } from "@/src/types/deck";
import { themes } from "@/src/themes";

interface ExportRequest {
  title: string;
  slides: Slide[];
  theme: string;
}

type RGB = { red: number; green: number; blue: number };
type SlidesRequest = Record<string, unknown>;

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return {
    red: parseInt(h.substring(0, 2), 16) / 255,
    green: parseInt(h.substring(2, 4), 16) / 255,
    blue: parseInt(h.substring(4, 6), 16) / 255,
  };
}

function isDark(hex: string): boolean {
  const h = hex.replace("#", "");
  return (
    parseInt(h.substring(0, 2), 16) +
    parseInt(h.substring(2, 4), 16) +
    parseInt(h.substring(4, 6), 16) < 384
  );
}

// Google Slides: 10in × 5.625in → 720pt × 405pt (16:9)
const PT = 12700; // EMU per point
function emu(pts: number) { return pts * PT; }

// Slide content area with generous margins
const MARGIN_L = 60;  // left margin pt
const MARGIN_R = 60;
const CONTENT_W = 720 - MARGIN_L - MARGIN_R; // 600pt

// Intent types that use "hero" layout (centered, bottom-anchored)
const HERO_INTENTS = new Set<string>(["title", "closing"]);
// Intent types that use "quote" layout (centered typographic)
const QUOTE_INTENTS = new Set<string>(["insight", "proof"]);

function rgbColor(dark: boolean, muted?: boolean): RGB {
  if (dark) return muted ? { red: 0.75, green: 0.75, blue: 0.75 } : { red: 1, green: 1, blue: 1 };
  return muted ? { red: 0.45, green: 0.45, blue: 0.45 } : { red: 0.1, green: 0.1, blue: 0.1 };
}

function parseBulletLeadIn(bullet: string): { lead: string; rest: string } | null {
  const match = bullet.match(/^(.+?)\s—\s(.+)$/);
  return match ? { lead: match[1], rest: match[2] } : null;
}

function buildHeroSlide(slide: Slide, slideId: string, bg: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const badgeId = `badge_${slide.slide_number}`;
  const headlineId = `headline_${slide.slide_number}`;
  const subId = `sub_${slide.slide_number}`;

  // Badge (top-left for title, centered for closing)
  const isClosing = slide.type === "closing";
  reqs.push({
    createShape: {
      objectId: badgeId,
      shapeType: "TEXT_BOX",
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(200), unit: "EMU" }, height: { magnitude: emu(24), unit: "EMU" } },
        transform: {
          scaleX: 1, scaleY: 1,
          translateX: emu(isClosing ? 260 : MARGIN_L),
          translateY: emu(isClosing ? 140 : 220),
          unit: "EMU",
        },
      },
    },
  });
  reqs.push({ insertText: { objectId: badgeId, text: slide.type.toUpperCase(), insertionIndex: 0 } });
  reqs.push({
    updateTextStyle: {
      objectId: badgeId,
      style: {
        fontSize: { magnitude: 10, unit: "PT" },
        bold: true,
        foregroundColor: { opaqueColor: { rgbColor: accent } },
      },
      textRange: { type: "ALL" },
      fields: "fontSize,bold,foregroundColor",
    },
  });
  if (isClosing) {
    reqs.push({
      updateParagraphStyle: {
        objectId: badgeId,
        style: { alignment: "CENTER" },
        textRange: { type: "ALL" },
        fields: "alignment",
      },
    });
  }

  // Headline — large, bottom-anchored for title, centered for closing
  const hlY = isClosing ? 175 : 255;
  const hlSize = isClosing ? 30 : 34;
  reqs.push({
    createShape: {
      objectId: headlineId,
      shapeType: "TEXT_BOX",
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(100), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(hlY), unit: "EMU" },
      },
    },
  });
  reqs.push({ insertText: { objectId: headlineId, text: slide.headline, insertionIndex: 0 } });
  reqs.push({
    updateTextStyle: {
      objectId: headlineId,
      style: {
        bold: true,
        fontSize: { magnitude: hlSize, unit: "PT" },
        foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } },
      },
      textRange: { type: "ALL" },
      fields: "bold,fontSize,foregroundColor",
    },
  });
  if (isClosing) {
    reqs.push({
      updateParagraphStyle: {
        objectId: headlineId,
        style: { alignment: "CENTER" },
        textRange: { type: "ALL" },
        fields: "alignment",
      },
    });
  }

  // Subheadline
  if (slide.subheadline) {
    const subY = isClosing ? 280 : 340;
    reqs.push({
      createShape: {
        objectId: subId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(50), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(subY), unit: "EMU" },
        },
      },
    });
    reqs.push({ insertText: { objectId: subId, text: slide.subheadline, insertionIndex: 0 } });
    reqs.push({
      updateTextStyle: {
        objectId: subId,
        style: {
          fontSize: { magnitude: 15, unit: "PT" },
          foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } },
        },
        textRange: { type: "ALL" },
        fields: "fontSize,foregroundColor",
      },
    });
    if (isClosing) {
      reqs.push({
        updateParagraphStyle: {
          objectId: subId,
          style: { alignment: "CENTER" },
          textRange: { type: "ALL" },
          fields: "alignment",
        },
      });
    }
  }

  return reqs;
}

function buildQuoteSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const badgeId = `badge_${slide.slide_number}`;
  const headlineId = `headline_${slide.slide_number}`;
  const subId = `sub_${slide.slide_number}`;
  const bulletsId = `bullets_${slide.slide_number}`;

  // Badge centered
  reqs.push({
    createShape: {
      objectId: badgeId,
      shapeType: "TEXT_BOX",
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(22), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(60), unit: "EMU" },
      },
    },
  });
  reqs.push({ insertText: { objectId: badgeId, text: slide.type.toUpperCase(), insertionIndex: 0 } });
  reqs.push({
    updateTextStyle: {
      objectId: badgeId,
      style: {
        fontSize: { magnitude: 10, unit: "PT" },
        bold: true,
        foregroundColor: { opaqueColor: { rgbColor: accent } },
      },
      textRange: { type: "ALL" },
      fields: "fontSize,bold,foregroundColor",
    },
  });
  reqs.push({
    updateParagraphStyle: {
      objectId: badgeId,
      style: { alignment: "CENTER" },
      textRange: { type: "ALL" },
      fields: "alignment",
    },
  });

  // Headline centered, serif-style feel via larger size
  reqs.push({
    createShape: {
      objectId: headlineId,
      shapeType: "TEXT_BOX",
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(520), unit: "EMU" }, height: { magnitude: emu(140), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(100), translateY: emu(100), unit: "EMU" },
      },
    },
  });
  reqs.push({ insertText: { objectId: headlineId, text: slide.headline, insertionIndex: 0 } });
  reqs.push({
    updateTextStyle: {
      objectId: headlineId,
      style: {
        fontSize: { magnitude: 24, unit: "PT" },
        foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } },
      },
      textRange: { type: "ALL" },
      fields: "fontSize,foregroundColor",
    },
  });
  reqs.push({
    updateParagraphStyle: {
      objectId: headlineId,
      style: { alignment: "CENTER", lineSpacing: 150 },
      textRange: { type: "ALL" },
      fields: "alignment,lineSpacing",
    },
  });

  // Subheadline
  if (slide.subheadline) {
    reqs.push({
      createShape: {
        objectId: subId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: emu(480), unit: "EMU" }, height: { magnitude: emu(40), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(120), translateY: emu(255), unit: "EMU" },
        },
      },
    });
    reqs.push({ insertText: { objectId: subId, text: slide.subheadline, insertionIndex: 0 } });
    reqs.push({
      updateTextStyle: {
        objectId: subId,
        style: {
          fontSize: { magnitude: 13, unit: "PT" },
          foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } },
        },
        textRange: { type: "ALL" },
        fields: "fontSize,foregroundColor",
      },
    });
    reqs.push({
      updateParagraphStyle: {
        objectId: subId,
        style: { alignment: "CENTER" },
        textRange: { type: "ALL" },
        fields: "alignment",
      },
    });
  }

  // Bullets as keyword tags, centered
  if (slide.bullets.length > 0) {
    const tagsText = slide.bullets.slice(0, 3).join("  ·  ");
    reqs.push({
      createShape: {
        objectId: bulletsId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(30), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(320), unit: "EMU" },
        },
      },
    });
    reqs.push({ insertText: { objectId: bulletsId, text: tagsText, insertionIndex: 0 } });
    reqs.push({
      updateTextStyle: {
        objectId: bulletsId,
        style: {
          fontSize: { magnitude: 10, unit: "PT" },
          foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } },
        },
        textRange: { type: "ALL" },
        fields: "fontSize,foregroundColor",
      },
    });
    reqs.push({
      updateParagraphStyle: {
        objectId: bulletsId,
        style: { alignment: "CENTER" },
        textRange: { type: "ALL" },
        fields: "alignment",
      },
    });
  }

  return reqs;
}

function buildContentSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const accentBarId = `bar_${slide.slide_number}`;
  const badgeId = `badge_${slide.slide_number}`;
  const headlineId = `headline_${slide.slide_number}`;
  const subId = `sub_${slide.slide_number}`;
  const bulletsId = `bullets_${slide.slide_number}`;

  // Accent bar on the left edge
  reqs.push({
    createShape: {
      objectId: accentBarId,
      shapeType: "RECTANGLE",
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(4), unit: "EMU" }, height: { magnitude: emu(405), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: "EMU" },
      },
    },
  });
  reqs.push({
    updateShapeProperties: {
      objectId: accentBarId,
      shapeProperties: {
        shapeBackgroundFill: { solidFill: { color: { rgbColor: accent } } },
        outline: { propertyState: "NOT_RENDERED" },
      },
      fields: "shapeBackgroundFill.solidFill.color,outline",
    },
  });

  // Badge
  reqs.push({
    createShape: {
      objectId: badgeId,
      shapeType: "TEXT_BOX",
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(200), unit: "EMU" }, height: { magnitude: emu(22), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(38), unit: "EMU" },
      },
    },
  });
  reqs.push({ insertText: { objectId: badgeId, text: slide.type.toUpperCase(), insertionIndex: 0 } });
  reqs.push({
    updateTextStyle: {
      objectId: badgeId,
      style: {
        fontSize: { magnitude: 9, unit: "PT" },
        bold: true,
        foregroundColor: { opaqueColor: { rgbColor: accent } },
      },
      textRange: { type: "ALL" },
      fields: "fontSize,bold,foregroundColor",
    },
  });

  // Accent line under badge
  const lineId = `line_${slide.slide_number}`;
  reqs.push({
    createShape: {
      objectId: lineId,
      shapeType: "RECTANGLE",
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(36), unit: "EMU" }, height: { magnitude: emu(2), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(64), unit: "EMU" },
      },
    },
  });
  reqs.push({
    updateShapeProperties: {
      objectId: lineId,
      shapeProperties: {
        shapeBackgroundFill: { solidFill: { color: { rgbColor: accent } } },
        outline: { propertyState: "NOT_RENDERED" },
      },
      fields: "shapeBackgroundFill.solidFill.color,outline",
    },
  });

  // Headline
  reqs.push({
    createShape: {
      objectId: headlineId,
      shapeType: "TEXT_BOX",
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(70), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(76), unit: "EMU" },
      },
    },
  });
  reqs.push({ insertText: { objectId: headlineId, text: slide.headline, insertionIndex: 0 } });
  reqs.push({
    updateTextStyle: {
      objectId: headlineId,
      style: {
        bold: true,
        fontSize: { magnitude: 22, unit: "PT" },
        foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } },
      },
      textRange: { type: "ALL" },
      fields: "bold,fontSize,foregroundColor",
    },
  });

  // Subheadline
  let bulletsY = 155;
  if (slide.subheadline) {
    reqs.push({
      createShape: {
        objectId: subId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(40), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(148), unit: "EMU" },
        },
      },
    });
    reqs.push({ insertText: { objectId: subId, text: slide.subheadline, insertionIndex: 0 } });
    reqs.push({
      updateTextStyle: {
        objectId: subId,
        style: {
          fontSize: { magnitude: 13, unit: "PT" },
          foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } },
        },
        textRange: { type: "ALL" },
        fields: "fontSize,foregroundColor",
      },
    });
    bulletsY = 198;
  }

  // Bullets with bold lead-in support
  if (slide.bullets.length > 0) {
    const bulletsText = slide.bullets.map((b) => {
      const parsed = parseBulletLeadIn(b);
      return parsed ? `${parsed.lead} ${parsed.rest}` : b;
    }).join("\n");

    reqs.push({
      createShape: {
        objectId: bulletsId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: slideId,
          size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(405 - bulletsY - 30), unit: "EMU" } },
          transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(bulletsY), unit: "EMU" },
        },
      },
    });
    reqs.push({ insertText: { objectId: bulletsId, text: bulletsText, insertionIndex: 0 } });
    reqs.push({
      createParagraphBullets: {
        objectId: bulletsId,
        textRange: { type: "ALL" },
        bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
      },
    });

    // Style all bullet text as muted first
    reqs.push({
      updateTextStyle: {
        objectId: bulletsId,
        style: {
          fontSize: { magnitude: 13, unit: "PT" },
          foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } },
        },
        textRange: { type: "ALL" },
        fields: "fontSize,foregroundColor",
      },
    });

    // Apply paragraph spacing
    reqs.push({
      updateParagraphStyle: {
        objectId: bulletsId,
        style: { lineSpacing: 130, spaceAbove: { magnitude: 4, unit: "PT" } },
        textRange: { type: "ALL" },
        fields: "lineSpacing,spaceAbove",
      },
    });

    // Bold the lead-in portion of each bullet
    let charOffset = 0;
    for (const bullet of slide.bullets) {
      const parsed = parseBulletLeadIn(bullet);
      if (parsed) {
        reqs.push({
          updateTextStyle: {
            objectId: bulletsId,
            style: {
              bold: true,
              foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } },
            },
            textRange: {
              type: "FIXED_RANGE",
              startIndex: charOffset,
              endIndex: charOffset + parsed.lead.length,
            },
            fields: "bold,foregroundColor",
          },
        });
      }
      // +1 for the newline character between bullets
      const lineText = parsed ? `${parsed.lead} ${parsed.rest}` : bullet;
      charOffset += lineText.length + 1;
    }
  }

  return reqs;
}

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
    // Create blank presentation
    const createRes = await fetch(
      "https://slides.googleapis.com/v1/presentations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      }
    );

    if (createRes.status === 401) {
      return NextResponse.json({ error: "token_expired" }, { status: 401 });
    }
    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json(
        { error: `Failed to create presentation: ${err}` },
        { status: 502 }
      );
    }

    const presentation = await createRes.json();
    const presentationId = presentation.presentationId;
    const defaultSlideId = presentation.slides?.[0]?.objectId;

    // Build batch update requests
    const requests: SlidesRequest[] = [];

    for (const slide of slides) {
      const slideId = `slide_${slide.slide_number}`;
      const bg = activeTheme.backgrounds[slide.type as SlideIntent] || "#ffffff";
      const dark = isDark(bg);
      const accent = hexToRgb(activeTheme.accents[slide.type as SlideIntent] || "#333333");

      // Create slide with blank layout
      requests.push({
        createSlide: {
          objectId: slideId,
          slideLayoutReference: { predefinedLayout: "BLANK" },
        },
      });

      // Set background
      requests.push({
        updatePageProperties: {
          objectId: slideId,
          pageProperties: {
            pageBackgroundFill: {
              solidFill: { color: { rgbColor: hexToRgb(bg) } },
            },
          },
          fields: "pageBackgroundFill.solidFill.color",
        },
      });

      // Build layout-specific content
      if (HERO_INTENTS.has(slide.type)) {
        requests.push(...buildHeroSlide(slide, slideId, bg, accent, dark));
      } else if (QUOTE_INTENTS.has(slide.type)) {
        requests.push(...buildQuoteSlide(slide, slideId, accent, dark));
      } else {
        requests.push(...buildContentSlide(slide, slideId, accent, dark));
      }
    }

    // Delete default blank slide
    if (defaultSlideId) {
      requests.push({ deleteObject: { objectId: defaultSlideId } });
    }

    // Send batchUpdate
    const batchRes = await fetch(
      `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (batchRes.status === 401) {
      return NextResponse.json({ error: "token_expired" }, { status: 401 });
    }

    if (!batchRes.ok) {
      const err = await batchRes.text();
      return NextResponse.json(
        { error: `Failed to build slides: ${err}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Google Slides export error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
