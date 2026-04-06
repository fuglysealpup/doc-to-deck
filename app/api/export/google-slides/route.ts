import { NextRequest, NextResponse } from "next/server";
import { Slide, SlideIntent, SlideLayout } from "@/src/types/deck";
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

const PT = 12700;
function emu(pts: number) { return pts * PT; }

const MARGIN_L = 60;
const CONTENT_W = 720 - MARGIN_L - 60; // 600pt

function rgbColor(dark: boolean, muted?: boolean): RGB {
  if (dark) return muted ? { red: 0.75, green: 0.75, blue: 0.75 } : { red: 1, green: 1, blue: 1 };
  return muted ? { red: 0.45, green: 0.45, blue: 0.45 } : { red: 0.1, green: 0.1, blue: 0.1 };
}

function parseBulletLeadIn(bullet: string): { lead: string; rest: string } | null {
  const match = bullet.match(/^(.+?)\s—\s(.+)$/);
  return match ? { lead: match[1], rest: match[2] } : null;
}

// Reusable: badge + accent line + headline + subheadline at the top of a content slide
function buildContentHeader(slide: Slide, slideId: string, accent: RGB, dark: boolean): { reqs: SlidesRequest[]; nextY: number } {
  const reqs: SlidesRequest[] = [];
  const n = slide.slide_number;
  const barId = `bar_${n}`;
  const badgeId = `badge_${n}`;
  const lineId = `line_${n}`;
  const headlineId = `headline_${n}`;
  const subId = `sub_${n}`;

  // Accent bar
  reqs.push({ createShape: { objectId: barId, shapeType: "RECTANGLE", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(4), unit: "EMU" }, height: { magnitude: emu(405), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: "EMU" } } } });
  reqs.push({ updateShapeProperties: { objectId: barId, shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: accent } } }, outline: { propertyState: "NOT_RENDERED" } }, fields: "shapeBackgroundFill.solidFill.color,outline" } });

  // Badge
  reqs.push({ createShape: { objectId: badgeId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(200), unit: "EMU" }, height: { magnitude: emu(22), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(38), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: badgeId, text: slide.type.toUpperCase(), insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: badgeId, style: { fontSize: { magnitude: 9, unit: "PT" }, bold: true, foregroundColor: { opaqueColor: { rgbColor: accent } } }, textRange: { type: "ALL" }, fields: "fontSize,bold,foregroundColor" } });

  // Accent line
  reqs.push({ createShape: { objectId: lineId, shapeType: "RECTANGLE", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(36), unit: "EMU" }, height: { magnitude: emu(2), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(64), unit: "EMU" } } } });
  reqs.push({ updateShapeProperties: { objectId: lineId, shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: accent } } }, outline: { propertyState: "NOT_RENDERED" } }, fields: "shapeBackgroundFill.solidFill.color,outline" } });

  // Headline
  reqs.push({ createShape: { objectId: headlineId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(70), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(76), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: headlineId, text: slide.headline, insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: headlineId, style: { bold: true, fontSize: { magnitude: 22, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } } }, textRange: { type: "ALL" }, fields: "bold,fontSize,foregroundColor" } });

  let nextY = 155;
  if (slide.subheadline) {
    reqs.push({ createShape: { objectId: subId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(40), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(148), unit: "EMU" } } } });
    reqs.push({ insertText: { objectId: subId, text: slide.subheadline, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: subId, style: { fontSize: { magnitude: 13, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
    nextY = 198;
  }

  return { reqs, nextY };
}

// Helper: build bulleted text box with bold lead-ins
function buildBulletTextBox(objectId: string, slideId: string, bullets: string[], x: number, y: number, w: number, h: number, dark: boolean): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const bulletsText = bullets.map((b) => {
    const parsed = parseBulletLeadIn(b);
    return parsed ? `${parsed.lead} ${parsed.rest}` : b;
  }).join("\n");

  reqs.push({ createShape: { objectId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(w), unit: "EMU" }, height: { magnitude: emu(h), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(x), translateY: emu(y), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId, text: bulletsText, insertionIndex: 0 } });
  reqs.push({ createParagraphBullets: { objectId, textRange: { type: "ALL" }, bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" } });
  reqs.push({ updateTextStyle: { objectId, style: { fontSize: { magnitude: 13, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
  reqs.push({ updateParagraphStyle: { objectId, style: { lineSpacing: 130, spaceAbove: { magnitude: 4, unit: "PT" } }, textRange: { type: "ALL" }, fields: "lineSpacing,spaceAbove" } });

  let charOffset = 0;
  for (const bullet of bullets) {
    const parsed = parseBulletLeadIn(bullet);
    if (parsed) {
      reqs.push({ updateTextStyle: { objectId, style: { bold: true, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } } }, textRange: { type: "FIXED_RANGE", startIndex: charOffset, endIndex: charOffset + parsed.lead.length }, fields: "bold,foregroundColor" } });
    }
    const lineText = parsed ? `${parsed.lead} ${parsed.rest}` : bullet;
    charOffset += lineText.length + 1;
  }
  return reqs;
}

// ─── HERO ───
function buildHeroSlide(slide: Slide, slideId: string, bg: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const n = slide.slide_number;
  const isClosing = slide.type === "closing";

  reqs.push({ createShape: { objectId: `badge_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(200), unit: "EMU" }, height: { magnitude: emu(24), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(isClosing ? 260 : MARGIN_L), translateY: emu(isClosing ? 140 : 220), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: `badge_${n}`, text: slide.type.toUpperCase(), insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: `badge_${n}`, style: { fontSize: { magnitude: 10, unit: "PT" }, bold: true, foregroundColor: { opaqueColor: { rgbColor: accent } } }, textRange: { type: "ALL" }, fields: "fontSize,bold,foregroundColor" } });
  if (isClosing) reqs.push({ updateParagraphStyle: { objectId: `badge_${n}`, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, fields: "alignment" } });

  const hlY = isClosing ? 175 : 255;
  const hlSize = isClosing ? 30 : 34;
  reqs.push({ createShape: { objectId: `headline_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(100), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(hlY), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: `headline_${n}`, text: slide.headline, insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: `headline_${n}`, style: { bold: true, fontSize: { magnitude: hlSize, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } } }, textRange: { type: "ALL" }, fields: "bold,fontSize,foregroundColor" } });
  if (isClosing) reqs.push({ updateParagraphStyle: { objectId: `headline_${n}`, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, fields: "alignment" } });

  if (slide.subheadline) {
    const subY = isClosing ? 280 : 340;
    reqs.push({ createShape: { objectId: `sub_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(50), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(subY), unit: "EMU" } } } });
    reqs.push({ insertText: { objectId: `sub_${n}`, text: slide.subheadline, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: `sub_${n}`, style: { fontSize: { magnitude: 15, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
    if (isClosing) reqs.push({ updateParagraphStyle: { objectId: `sub_${n}`, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, fields: "alignment" } });
  }
  return reqs;
}

// ─── QUOTE ───
function buildQuoteSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const n = slide.slide_number;

  reqs.push({ createShape: { objectId: `badge_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(22), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(60), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: `badge_${n}`, text: slide.type.toUpperCase(), insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: `badge_${n}`, style: { fontSize: { magnitude: 10, unit: "PT" }, bold: true, foregroundColor: { opaqueColor: { rgbColor: accent } } }, textRange: { type: "ALL" }, fields: "fontSize,bold,foregroundColor" } });
  reqs.push({ updateParagraphStyle: { objectId: `badge_${n}`, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, fields: "alignment" } });

  reqs.push({ createShape: { objectId: `headline_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(520), unit: "EMU" }, height: { magnitude: emu(140), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(100), translateY: emu(100), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: `headline_${n}`, text: slide.headline, insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: `headline_${n}`, style: { fontSize: { magnitude: 24, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
  reqs.push({ updateParagraphStyle: { objectId: `headline_${n}`, style: { alignment: "CENTER", lineSpacing: 150 }, textRange: { type: "ALL" }, fields: "alignment,lineSpacing" } });

  if (slide.subheadline) {
    reqs.push({ createShape: { objectId: `sub_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(480), unit: "EMU" }, height: { magnitude: emu(40), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(120), translateY: emu(255), unit: "EMU" } } } });
    reqs.push({ insertText: { objectId: `sub_${n}`, text: slide.subheadline, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: `sub_${n}`, style: { fontSize: { magnitude: 13, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
    reqs.push({ updateParagraphStyle: { objectId: `sub_${n}`, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, fields: "alignment" } });
  }

  if (slide.bullets.length > 0) {
    const tagsText = slide.bullets.slice(0, 3).join("  ·  ");
    reqs.push({ createShape: { objectId: `bullets_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(30), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(320), unit: "EMU" } } } });
    reqs.push({ insertText: { objectId: `bullets_${n}`, text: tagsText, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: `bullets_${n}`, style: { fontSize: { magnitude: 10, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
    reqs.push({ updateParagraphStyle: { objectId: `bullets_${n}`, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, fields: "alignment" } });
  }
  return reqs;
}

// ─── CONTENT (default fallback) ───
function buildContentSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const { reqs, nextY } = buildContentHeader(slide, slideId, accent, dark);
  if (slide.bullets.length > 0) {
    reqs.push(...buildBulletTextBox(`bullets_${slide.slide_number}`, slideId, slide.bullets, MARGIN_L, nextY, CONTENT_W, 405 - nextY - 30, dark));
  }
  return reqs;
}

// ─── STAT HERO ───
function buildStatHeroSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const { reqs, nextY } = buildContentHeader(slide, slideId, accent, dark);
  const n = slide.slide_number;
  const stats = slide.bullets.slice(0, 3);
  const count = stats.length || 1;
  const colW = Math.floor(CONTENT_W / count);
  const statY = Math.max(nextY + 20, 210);

  stats.forEach((bullet, i) => {
    const parsed = parseBulletLeadIn(bullet);
    const statText = parsed ? parsed.lead : bullet;
    const labelText = parsed ? parsed.rest : "";
    const x = MARGIN_L + i * colW + colW / 2 - 100;

    // Stat value
    const statId = `stat_${n}_${i}`;
    reqs.push({ createShape: { objectId: statId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(200), unit: "EMU" }, height: { magnitude: emu(50), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(x), translateY: emu(statY), unit: "EMU" } } } });
    reqs.push({ insertText: { objectId: statId, text: statText, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: statId, style: { bold: true, fontSize: { magnitude: 30, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: accent } } }, textRange: { type: "ALL" }, fields: "bold,fontSize,foregroundColor" } });
    reqs.push({ updateParagraphStyle: { objectId: statId, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, fields: "alignment" } });

    // Label
    if (labelText) {
      const lblId = `statlbl_${n}_${i}`;
      reqs.push({ createShape: { objectId: lblId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(200), unit: "EMU" }, height: { magnitude: emu(60), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(x), translateY: emu(statY + 52), unit: "EMU" } } } });
      reqs.push({ insertText: { objectId: lblId, text: labelText.toUpperCase(), insertionIndex: 0 } });
      reqs.push({ updateTextStyle: { objectId: lblId, style: { fontSize: { magnitude: 9, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
      reqs.push({ updateParagraphStyle: { objectId: lblId, style: { alignment: "CENTER", lineSpacing: 120 }, textRange: { type: "ALL" }, fields: "alignment,lineSpacing" } });
    }
  });
  return reqs;
}

// ─── TABLE / COMPARISON MATRIX (shared logic) ───
function buildTableSlideShared(slide: Slide, slideId: string, accent: RGB, dark: boolean, isMatrix: boolean): SlidesRequest[] {
  const { reqs, nextY } = buildContentHeader(slide, slideId, accent, dark);
  const n = slide.slide_number;
  const tableId = `table_${n}`;

  // Parse pipe-delimited bullets
  const headers = slide.bullets.length > 0
    ? slide.bullets[0].split("|").map(s => s.trim()).filter(Boolean)
    : [];
  const dataRows = slide.bullets.slice(1).map(b => {
    const parts = b.split("|").map(s => s.trim());
    return { entity: parts[0] || "", cells: parts.slice(1) };
  });

  const numCols = headers.length + 1; // +1 for entity column
  const numRows = dataRows.length + 1; // +1 for header row
  const tableH = Math.min(405 - nextY - 20, numRows * 32 + 10);

  reqs.push({
    createTable: {
      objectId: tableId,
      elementProperties: {
        pageObjectId: slideId,
        size: { width: { magnitude: emu(CONTENT_W), unit: "EMU" }, height: { magnitude: emu(tableH), unit: "EMU" } },
        transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(nextY + 5), unit: "EMU" },
      },
      rows: numRows,
      columns: numCols,
    },
  });

  // Header row: empty first cell + attribute names
  headers.forEach((h, ci) => {
    reqs.push({ insertText: { objectId: tableId, text: h, cellLocation: { rowIndex: 0, columnIndex: ci + 1 }, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: tableId, style: { bold: true, fontSize: { magnitude: 9, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: { red: 1, green: 1, blue: 1 } } } }, textRange: { type: "ALL" }, cellLocation: { rowIndex: 0, columnIndex: ci + 1 }, fields: "bold,fontSize,foregroundColor" } });
    reqs.push({ updateParagraphStyle: { objectId: tableId, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, cellLocation: { rowIndex: 0, columnIndex: ci + 1 }, fields: "alignment" } });
  });

  // Header row background
  for (let ci = 0; ci < numCols; ci++) {
    reqs.push({ updateTableCellProperties: { objectId: tableId, tableRange: { location: { rowIndex: 0, columnIndex: ci }, rowSpan: 1, columnSpan: 1 }, tableCellProperties: { tableCellBackgroundFill: { solidFill: { color: { rgbColor: accent } } } }, fields: "tableCellBackgroundFill.solidFill.color" } });
  }

  // Data rows
  dataRows.forEach((row, ri) => {
    const rowIdx = ri + 1;
    // Entity name
    reqs.push({ insertText: { objectId: tableId, text: row.entity, cellLocation: { rowIndex: rowIdx, columnIndex: 0 }, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: tableId, style: { bold: true, fontSize: { magnitude: 10, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } } }, textRange: { type: "ALL" }, cellLocation: { rowIndex: rowIdx, columnIndex: 0 }, fields: "bold,fontSize,foregroundColor" } });

    // Cell values
    row.cells.forEach((val, ci) => {
      const colIdx = ci + 1;
      const trimVal = val.trim();
      const isPos = /^(✓|yes|true)$/i.test(trimVal);
      const isNeg = /^(✗|no|false)$/i.test(trimVal);
      const displayText = isPos ? "✓" : isNeg ? "✗" : trimVal;
      const cellColor = isMatrix && isPos
        ? { red: 0.2, green: 0.7, blue: 0.3 }
        : isMatrix && isNeg
        ? { red: 0.8, green: 0.2, blue: 0.2 }
        : rgbColor(dark, true);

      reqs.push({ insertText: { objectId: tableId, text: displayText, cellLocation: { rowIndex: rowIdx, columnIndex: colIdx }, insertionIndex: 0 } });
      reqs.push({ updateTextStyle: { objectId: tableId, style: { fontSize: { magnitude: 10, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: cellColor } } }, textRange: { type: "ALL" }, cellLocation: { rowIndex: rowIdx, columnIndex: colIdx }, fields: "fontSize,foregroundColor" } });
      reqs.push({ updateParagraphStyle: { objectId: tableId, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, cellLocation: { rowIndex: rowIdx, columnIndex: colIdx }, fields: "alignment" } });
    });

    // Alternating row tint
    if (ri % 2 === 1) {
      for (let ci = 0; ci < numCols; ci++) {
        reqs.push({ updateTableCellProperties: { objectId: tableId, tableRange: { location: { rowIndex: rowIdx, columnIndex: ci }, rowSpan: 1, columnSpan: 1 }, tableCellProperties: { tableCellBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.97, green: 0.97, blue: 0.97 } } } } }, fields: "tableCellBackgroundFill.solidFill.color" } });
      }
    }
  });

  return reqs;
}

function buildTableSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  return buildTableSlideShared(slide, slideId, accent, dark, false);
}

function buildComparisonMatrixSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  return buildTableSlideShared(slide, slideId, accent, dark, true);
}

// ─── PRO-CON ───
function buildProConSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const { reqs, nextY } = buildContentHeader(slide, slideId, accent, dark);
  const n = slide.slide_number;
  const pros: string[] = [];
  const cons: string[] = [];
  for (const b of slide.bullets) {
    if (/^CON:\s*/i.test(b.trim())) cons.push(b.trim().replace(/^CON:\s*/i, ""));
    else if (/^PRO:\s*/i.test(b.trim())) pros.push(b.trim().replace(/^PRO:\s*/i, ""));
    else pros.push(b.trim());
  }

  const colW = (CONTENT_W - 20) / 2;
  const colY = nextY + 10;
  const colH = 405 - colY - 30;
  const proColor: RGB = { red: 0.1, green: 0.5, blue: 0.3 };
  const conColor: RGB = { red: 0.7, green: 0.33, blue: 0.04 };

  // Pro header
  const proHdrId = `prohdr_${n}`;
  reqs.push({ createShape: { objectId: proHdrId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(colW), unit: "EMU" }, height: { magnitude: emu(20), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(colY), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: proHdrId, text: "BENEFITS", insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: proHdrId, style: { bold: true, fontSize: { magnitude: 9, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: proColor } } }, textRange: { type: "ALL" }, fields: "bold,fontSize,foregroundColor" } });

  // Con header
  const conHdrId = `conhdr_${n}`;
  reqs.push({ createShape: { objectId: conHdrId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(colW), unit: "EMU" }, height: { magnitude: emu(20), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L + colW + 20), translateY: emu(colY), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: conHdrId, text: "CHALLENGES", insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: conHdrId, style: { bold: true, fontSize: { magnitude: 9, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: conColor } } }, textRange: { type: "ALL" }, fields: "bold,fontSize,foregroundColor" } });

  // Pro bullets
  if (pros.length > 0) {
    const proId = `pros_${n}`;
    const proText = pros.map(p => `✓  ${p}`).join("\n");
    reqs.push({ createShape: { objectId: proId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(colW), unit: "EMU" }, height: { magnitude: emu(colH - 28), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(colY + 28), unit: "EMU" } } } });
    reqs.push({ insertText: { objectId: proId, text: proText, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: proId, style: { fontSize: { magnitude: 12, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
    reqs.push({ updateParagraphStyle: { objectId: proId, style: { lineSpacing: 140, spaceAbove: { magnitude: 3, unit: "PT" } }, textRange: { type: "ALL" }, fields: "lineSpacing,spaceAbove" } });
  }

  // Con bullets
  if (cons.length > 0) {
    const conId = `cons_${n}`;
    const conText = cons.map(c => `⚠  ${c}`).join("\n");
    reqs.push({ createShape: { objectId: conId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(colW), unit: "EMU" }, height: { magnitude: emu(colH - 28), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L + colW + 20), translateY: emu(colY + 28), unit: "EMU" } } } });
    reqs.push({ insertText: { objectId: conId, text: conText, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: conId, style: { fontSize: { magnitude: 12, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
    reqs.push({ updateParagraphStyle: { objectId: conId, style: { lineSpacing: 140, spaceAbove: { magnitude: 3, unit: "PT" } }, textRange: { type: "ALL" }, fields: "lineSpacing,spaceAbove" } });
  }

  return reqs;
}

// ─── SPLIT ───
function buildSplitSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const n = slide.slide_number;
  const leftW = 240;
  const rightW = CONTENT_W - leftW - 30;

  // Accent bar
  reqs.push({ createShape: { objectId: `bar_${n}`, shapeType: "RECTANGLE", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(4), unit: "EMU" }, height: { magnitude: emu(405), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: "EMU" } } } });
  reqs.push({ updateShapeProperties: { objectId: `bar_${n}`, shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: accent } } }, outline: { propertyState: "NOT_RENDERED" } }, fields: "shapeBackgroundFill.solidFill.color,outline" } });

  // Left side: badge, headline, subheadline
  reqs.push({ createShape: { objectId: `badge_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(leftW), unit: "EMU" }, height: { magnitude: emu(22), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(60), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: `badge_${n}`, text: slide.type.toUpperCase(), insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: `badge_${n}`, style: { fontSize: { magnitude: 9, unit: "PT" }, bold: true, foregroundColor: { opaqueColor: { rgbColor: accent } } }, textRange: { type: "ALL" }, fields: "fontSize,bold,foregroundColor" } });

  reqs.push({ createShape: { objectId: `headline_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(leftW), unit: "EMU" }, height: { magnitude: emu(100), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(90), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: `headline_${n}`, text: slide.headline, insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: `headline_${n}`, style: { bold: true, fontSize: { magnitude: 20, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } } }, textRange: { type: "ALL" }, fields: "bold,fontSize,foregroundColor" } });

  if (slide.subheadline) {
    reqs.push({ createShape: { objectId: `sub_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(leftW), unit: "EMU" }, height: { magnitude: emu(80), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(MARGIN_L), translateY: emu(195), unit: "EMU" } } } });
    reqs.push({ insertText: { objectId: `sub_${n}`, text: slide.subheadline, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: `sub_${n}`, style: { fontSize: { magnitude: 12, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
  }

  // Right side: bullets
  if (slide.bullets.length > 0) {
    const rightX = MARGIN_L + leftW + 30;
    reqs.push(...buildBulletTextBox(`bullets_${n}`, slideId, slide.bullets, rightX, 60, rightW, 310, dark));
  }

  return reqs;
}

// ─── CARDS ───
function buildCardsSlide(slide: Slide, slideId: string, accent: RGB, dark: boolean): SlidesRequest[] {
  const { reqs, nextY } = buildContentHeader(slide, slideId, accent, dark);
  const n = slide.slide_number;
  const cards = slide.bullets.slice(0, 6);
  const cols = cards.length <= 3 ? cards.length : Math.ceil(cards.length / 2);
  const rows = Math.ceil(cards.length / cols);
  const cardW = Math.floor((CONTENT_W - (cols - 1) * 10) / cols);
  const availH = 405 - nextY - 30;
  const cardH = Math.floor((availH - (rows - 1) * 8) / rows);

  cards.forEach((bullet, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = MARGIN_L + col * (cardW + 10);
    const y = nextY + 5 + row * (cardH + 8);
    const cardId = `card_${n}_${i}`;
    const parsed = parseBulletLeadIn(bullet);
    const text = parsed ? `${parsed.lead}\n${parsed.rest}` : bullet;

    reqs.push({ createShape: { objectId: cardId, shapeType: "ROUND_RECTANGLE", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(cardW), unit: "EMU" }, height: { magnitude: emu(cardH), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(x), translateY: emu(y), unit: "EMU" } } } });
    reqs.push({ updateShapeProperties: { objectId: cardId, shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.96, green: 0.96, blue: 0.96 } } } }, outline: { propertyState: "NOT_RENDERED" } }, fields: "shapeBackgroundFill.solidFill.color,outline" } });
    reqs.push({ insertText: { objectId: cardId, text, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: cardId, style: { fontSize: { magnitude: 11, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark, true) } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });

    if (parsed) {
      reqs.push({ updateTextStyle: { objectId: cardId, style: { bold: true, fontSize: { magnitude: 12, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: rgbColor(dark) } } }, textRange: { type: "FIXED_RANGE", startIndex: 0, endIndex: parsed.lead.length }, fields: "bold,fontSize,foregroundColor" } });
    }
  });

  return reqs;
}

// ─── DIVIDER ───
function buildDividerSlide(slide: Slide, slideId: string, accent: RGB): SlidesRequest[] {
  const reqs: SlidesRequest[] = [];
  const n = slide.slide_number;

  // Override background to accent color
  reqs.push({ updatePageProperties: { objectId: slideId, pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: accent } } } }, fields: "pageBackgroundFill.solidFill.color" } });

  // Thin line above headline
  const lineId = `divline_${n}`;
  reqs.push({ createShape: { objectId: lineId, shapeType: "RECTANGLE", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(40), unit: "EMU" }, height: { magnitude: emu(2), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(340), translateY: emu(155), unit: "EMU" } } } });
  reqs.push({ updateShapeProperties: { objectId: lineId, shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 1, green: 1, blue: 1 } } } }, outline: { propertyState: "NOT_RENDERED" } }, fields: "shapeBackgroundFill.solidFill.color,outline" } });

  // Headline centered
  reqs.push({ createShape: { objectId: `headline_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(520), unit: "EMU" }, height: { magnitude: emu(80), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(100), translateY: emu(168), unit: "EMU" } } } });
  reqs.push({ insertText: { objectId: `headline_${n}`, text: slide.headline, insertionIndex: 0 } });
  reqs.push({ updateTextStyle: { objectId: `headline_${n}`, style: { bold: true, fontSize: { magnitude: 32, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: { red: 1, green: 1, blue: 1 } } } }, textRange: { type: "ALL" }, fields: "bold,fontSize,foregroundColor" } });
  reqs.push({ updateParagraphStyle: { objectId: `headline_${n}`, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, fields: "alignment" } });

  if (slide.subheadline) {
    reqs.push({ createShape: { objectId: `sub_${n}`, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, size: { width: { magnitude: emu(480), unit: "EMU" }, height: { magnitude: emu(40), unit: "EMU" } }, transform: { scaleX: 1, scaleY: 1, translateX: emu(120), translateY: emu(255), unit: "EMU" } } } });
    reqs.push({ insertText: { objectId: `sub_${n}`, text: slide.subheadline, insertionIndex: 0 } });
    reqs.push({ updateTextStyle: { objectId: `sub_${n}`, style: { fontSize: { magnitude: 15, unit: "PT" }, foregroundColor: { opaqueColor: { rgbColor: { red: 1, green: 1, blue: 1 } } } }, textRange: { type: "ALL" }, fields: "fontSize,foregroundColor" } });
    reqs.push({ updateParagraphStyle: { objectId: `sub_${n}`, style: { alignment: "CENTER" }, textRange: { type: "ALL" }, fields: "alignment" } });
  }

  return reqs;
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

    for (const slide of slides) {
      const slideId = `slide_${slide.slide_number}`;
      const bg = activeTheme.backgrounds[slide.type as SlideIntent] || "#ffffff";
      const dark = isDark(bg);
      const accent = hexToRgb(activeTheme.accents[slide.type as SlideIntent] || "#333333");

      requests.push({ createSlide: { objectId: slideId, slideLayoutReference: { predefinedLayout: "BLANK" } } });
      requests.push({ updatePageProperties: { objectId: slideId, pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: hexToRgb(bg) } } } }, fields: "pageBackgroundFill.solidFill.color" } });

      // Route by layout first, then by intent
      const layout = slide.layout as SlideLayout | undefined;

      if (layout === "stat-hero") {
        requests.push(...buildStatHeroSlide(slide, slideId, accent, dark));
      } else if (layout === "table") {
        requests.push(...buildTableSlide(slide, slideId, accent, dark));
      } else if (layout === "comparison-matrix") {
        requests.push(...buildComparisonMatrixSlide(slide, slideId, accent, dark));
      } else if (layout === "pro-con") {
        requests.push(...buildProConSlide(slide, slideId, accent, dark));
      } else if (layout === "cards") {
        requests.push(...buildCardsSlide(slide, slideId, accent, dark));
      } else if (layout === "divider") {
        requests.push(...buildDividerSlide(slide, slideId, accent));
      } else if (layout === "split") {
        requests.push(...buildSplitSlide(slide, slideId, accent, dark));
      } else if (layout === "hero" || (!layout && (slide.type === "title" || slide.type === "closing"))) {
        requests.push(...buildHeroSlide(slide, slideId, bg, accent, dark));
      } else if (layout === "quote" || (!layout && (slide.type === "insight" || slide.type === "proof"))) {
        requests.push(...buildQuoteSlide(slide, slideId, accent, dark));
      } else {
        requests.push(...buildContentSlide(slide, slideId, accent, dark));
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

    return NextResponse.json({ url: `https://docs.google.com/presentation/d/${presentationId}/edit` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Google Slides export error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
