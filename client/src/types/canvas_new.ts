// models/canvas.ts

export enum CanvasElementType {
  Image = "Image",
  Text = "Text",
}

export interface Canvas {
  id: string;
  name: string;
  data: CanvasData;
  elements: CanvasElement[];
  userId: string;
  createdAt: string; // Using string for DateTime
  updatedAt: string;
}

export interface CanvasData {
  position: CanvasPosition;
  scale: number;
}

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CanvasElement {
  type: CanvasElementType;
  data: CanvasElementData;
  content: string;
  imageId: string;
}

export interface CanvasElementData {
  position: CanvasElementPosition;
  size: CanvasElementSize;
  rotation: number;
}

export interface CanvasElementPosition {
  x: number;
  y: number;
  zIndex: number;
}

export interface CanvasElementSize {
  width: number;
  height: number;
}
