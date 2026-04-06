export const CANVAS_W = 720;
export const CANVAS_H = 405;
export const MARGIN_L = 56;
export const MARGIN_R = 56;
export const MARGIN_T = 44;
export const MARGIN_B = 30;
export const CONTENT_W = CANVAS_W - MARGIN_L - MARGIN_R; // 608pt

export interface LayoutElement {
  id: string;
  type: 'text' | 'shape' | 'table';
  x: number;
  y: number;
  width: number;
  height: number;
  style: ElementStyle;
  content?: string;
  richContent?: { bold: string; regular: string }[];
  tableData?: TableData;
  children?: LayoutElement[];
}

export interface ElementStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right';
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase';
  letterSpacing?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
}

export interface TableData {
  headers: string[];
  rows: TableRow[];
  columnWidths?: number[];
  headerStyle?: {
    backgroundColor: string;
    color: string;
    bold: boolean;
  };
}

export interface TableRow {
  cells: TableCell[];
  backgroundColor?: string;
}

export interface TableCell {
  content: string;
  bold?: boolean;
  color?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface LayoutSpec {
  elements: LayoutElement[];
  background: string;
}
