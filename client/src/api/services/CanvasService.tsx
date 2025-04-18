import apiClient from "../apiClient";
import { Canvas } from "@/types/canvas";
import { canvasListItem } from "@/types/CanvasListItem";

export async function createCanvas(name: string): Promise<Canvas> {
  try {
    const response = await apiClient.post("canvases", { name });
    return response.data;
  } catch (error) {
    console.error("Error creating canvas:", error);
    throw new Error("Failed to create canvas");
  }
}

export async function getCanvasesForUser(): Promise<canvasListItem[]> {
  try {
    const response = await apiClient.get("canvases");
    return response.data;
  } catch (error) {
    console.error("Error fetching canvases:", error);
    throw new Error("Failed to retrieve canvases");
  }
}

export async function deleteCanvas(id: string): Promise<any> {
  try {
    const response = await apiClient.delete(`canvases/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting canvas:", error);
    throw new Error("Failed to delete canvas");
  }
}

export async function getCanvas(id: string): Promise<Canvas> {
  try {
    const response = await apiClient.get(`canvases/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching canvas:", error);
    // You can transform technical errors into domain-specific ones
    throw new Error("Failed to retrieve canvas");
  }
}

export async function updateCanvas(canvas: Canvas): Promise<Canvas> {
  try {
    // Send with Pascal case as required by C# backend
    const response = await apiClient.put(`canvases/${canvas.id}`, canvas);
    return response.data;
  } catch (error) {
    console.error("Error updating canvas:", error);
    throw new Error("Failed to update canvas");
  }
}
