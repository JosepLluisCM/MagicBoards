import { Canvas } from "../../types";
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
  console.log("toServerFormat received:", {
    canvasData,
    hasId: canvasData && canvasData.id ? true : false,
    id: canvasData?.id,
    Id: canvasData?.Id,
  });

  // Check for id in both lowercase and uppercase formats
  const canvasId = canvasData?.id || canvasData?.Id;

  if (!canvasData || !canvasId) {
    console.error("Invalid canvas data:", canvasData);
    throw new Error("Invalid canvas data provided - missing ID");
  }

  // Create the server canvas with correct property casing
  const serverCanvas: ServerCanvas = {
    Id: canvasId,
    UserId: canvasData.userId || canvasData.UserId,
    Name: canvasData.name || canvasData.Name || "Untitled Canvas",
    CreatedAt: canvasData.createdAt || canvasData.CreatedAt || new Date(),
    UpdatedAt: new Date(), // Always update the updatedAt timestamp
    Position: {
      X: Math.round(stageX),
      Y: Math.round(stageY),
    },
    Scale: Math.round(stageScale * 100),
    Elements: [],
  };

  // Convert elements with proper data transformation
  const elements = canvasData.elements || canvasData.Elements || [];
  if (Array.isArray(elements)) {
    serverCanvas.Elements = elements.map((element: any) => {
      return {
        Type: element.type || element.Type || "unknown",
        Content: element.content || element.Content || "",
        ImageId: element.imageId || element.ImageId || element.imagePath || "",
        Position: {
          X: Math.round(
            element.x ||
              element.X ||
              element.position?.X ||
              element.Position?.X ||
              0
          ),
          Y: Math.round(
            element.y ||
              element.Y ||
              element.position?.Y ||
              element.Position?.Y ||
              0
          ),
        },
        Size: {
          Width: Math.round(
            element.width ||
              element.Width ||
              element.size?.Width ||
              element.Size?.Width ||
              100
          ),
          Height: Math.round(
            element.height ||
              element.Height ||
              element.size?.Height ||
              element.Size?.Height ||
              100
          ),
        },
        Style: {
          FillColor:
            element.style?.FillColor ||
            element.style?.fillColor ||
            element.Style?.FillColor ||
            "#000000",
          BorderColor:
            element.style?.BorderColor ||
            element.style?.borderColor ||
            element.Style?.BorderColor ||
            "#000000",
          FontSize:
            element.style?.FontSize ||
            element.style?.fontSize ||
            element.Style?.FontSize ||
            16,
          Color:
            element.style?.Color ||
            element.style?.color ||
            element.Style?.Color ||
            "#000000",
        },
      };
    });
  } else {
    console.warn("No elements array found in canvas data");
  }

  console.log("Converted to serverCanvas:", serverCanvas);
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
    if (!canvasData) {
      throw new Error("No canvas data provided to saveCanvasToServer");
    }

    console.log("saveCanvasToServer received:", {
      canvasData,
      stageX,
      stageY,
      stageScale,
    });

    const serverCanvas = toServerFormat(canvasData, stageX, stageY, stageScale);
    console.log("Calling API updateCanvas with:", serverCanvas);
    return await apiUpdateCanvas(serverCanvas);
  } catch (error) {
    console.error("Error in saveCanvasToServer:", error);
    if (error instanceof Error) {
      throw error; // Preserve original error and stack trace
    } else {
      throw new Error("Failed to save canvas: Unknown error");
    }
  }
}
