import {
  Canvas,
  CanvasElement,
  Position,
  Size,
  ElementStyle,
} from "../../types";
import { updateCanvas as apiUpdateCanvas } from "./CanvasService";

// Define server-side canvas interface that matches the C# model
export interface ServerCanvas {
  Id: string;
  UserId: string;
  Name: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  Position: {
    X: number;
    Y: number;
  };
  Scale: number;
  Elements: ServerCanvasElement[];
}

export interface ServerCanvasElement {
  Type: string;
  Content: string;
  ImageId: string;
  Position: {
    X: number;
    Y: number;
  };
  Size: {
    Width: number;
    Height: number;
  };
  Style: {
    FillColor: string;
    BorderColor: string;
    FontSize: number;
    Color: string;
  };
}

/**
 * Convert a client Canvas object to server-compatible format
 * This handles the PascalCase property names required by the C# backend
 */
export function toServerFormat(
  canvasData: any, // Accept any type to avoid typescript errors in transition
  stageX: number,
  stageY: number,
  stageScale: number
): ServerCanvas {
  if (!canvasData || !canvasData.id) {
    throw new Error("Invalid canvas data provided");
  }

  // Create the server canvas with correct property casing
  const serverCanvas: ServerCanvas = {
    Id: canvasData.id,
    UserId: canvasData.userId,
    Name: canvasData.name || "Untitled Canvas",
    CreatedAt: canvasData.createdAt || new Date(),
    UpdatedAt: new Date(), // Always update the updatedAt timestamp
    Position: {
      X: Math.round(stageX),
      Y: Math.round(stageY),
    },
    Scale: Math.round(stageScale * 100),
    Elements: [],
  };

  // Convert elements with proper data transformation
  if (canvasData.elements && Array.isArray(canvasData.elements)) {
    serverCanvas.Elements = canvasData.elements.map((element: any) => {
      return {
        Type: element.type || "unknown",
        Content: element.content || "",
        ImageId: element.imageId || element.imagePath || "",
        Position: {
          X: Math.round(element.x || 0),
          Y: Math.round(element.y || 0),
        },
        Size: {
          Width: Math.round(element.width || 100),
          Height: Math.round(element.height || 100),
        },
        Style: {
          FillColor: element.style?.FillColor || "#000000",
          BorderColor: element.style?.BorderColor || "#000000",
          FontSize: element.style?.FontSize || 16,
          Color: element.style?.Color || "#000000",
        },
      };
    });
  }

  return serverCanvas;
}

/**
 * Save canvas to server using the proper format expected by the C# backend
 */
export async function saveCanvasToServer(
  canvasData: any, // Accept any type to handle mixed format data
  stageX: number,
  stageY: number,
  stageScale: number
): Promise<Canvas> {
  try {
    const serverCanvas = toServerFormat(canvasData, stageX, stageY, stageScale);
    return await apiUpdateCanvas(serverCanvas);
  } catch (error) {
    console.error("Error in saveCanvasToServer:", error);
    throw new Error(
      "Failed to save canvas: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}
