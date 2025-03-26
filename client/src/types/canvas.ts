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
  id?: string;
  type: string;
  // Text-specific properties
  content?: string;
  // Image-specific properties
  imageId?: string;
  imagePath?: string;
  src?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  isDragging?: boolean;
  position: Position;
  size: Size;
  style: ElementStyle;
}

export interface Position {
  x: number;
  y: number;
  X?: number;
  Y?: number;
}

export interface Size {
  width: number;
  height: number;
  Width?: number;
  Height?: number;
}

export interface ElementStyle {
  fillColor: string;
  borderColor: string;
  fontSize: number;
  color: string;
  FillColor?: string;
  BorderColor?: string;
  FontSize?: number;
  Color?: string;
}

// Canvas component types
export interface ServerPosition {
  X: number;
  Y: number;
  x?: number;
  y?: number;
}

export interface ServerSize {
  Width: number;
  Height: number;
}

export interface ServerElementStyle {
  FillColor: string;
  BorderColor: string;
  FontSize: number;
  Color: string;
}

export interface CanvasData {
  id: string;
  userId: string;
  name: string;
  elements: CanvasElement[];
  createdAt?: Date;
  updatedAt?: Date;
  position?: ServerPosition;
  scale?: number;
}

export interface StagePosition {
  x: number;
  y: number;
  scale: number;
}
