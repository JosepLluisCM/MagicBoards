export enum ShapeType {
  Text = "Text",
  Image = "Image",
}

export interface Canvas {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  position: Position;
  scale: number;
  elements: CanvasElement[];
}

export interface CanvasElement {
  type: string;
  // Text-specific properties
  content?: string;
  // Image-specific properties
  imageId?: string;
  position: Position;
  size: Size;
  style: ElementStyle;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ElementStyle {
  fillColor: string;
  borderColor: string;
  fontSize: number;
  color: string;
}
