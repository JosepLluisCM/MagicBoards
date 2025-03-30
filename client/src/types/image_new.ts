// models/image.ts

export enum ImageType {
  Uploaded = "Uploaded",
  Generated = "Generated",
}

export interface Image {
  id: string;
  type: ImageType;
  imageUrl: string;
  canvasId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: ImageMetadata; // Optional
}

export interface ImageMetadata {
  format?: string;
  originalSize?: string;
}
