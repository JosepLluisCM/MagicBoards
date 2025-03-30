import { Size } from "./canvas_old";

export enum ImageType {
  Uploaded = "Uploaded",
  Generated = "Generated",
}

export interface Image {
  id: string;
  canvasId: string;
  imageUrl: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // UserId
  updatedBy: string; // UserId
  metadata: Metadata;
}

export interface Metadata {
  size: Size;
  format: string;
  prompt: string;
  model: string;
  parameters: Parameters;
}

export interface Parameters {
  seed: string;
  steps: string;
  style: string;
}
