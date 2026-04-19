import apiClient from "../apiClient";
import { Canvas } from "@/types/canvas";
import { canvasListItem } from "@/types/CanvasListItem";
import { CreateCanvasRequest } from "@/types/requests/CreateCanvasRequest";
import { UpdateCanvasRequest } from "@/types/requests/UpdateCanvasRequest";

export async function createCanvas(request: CreateCanvasRequest): Promise<Canvas> {
  const response = await apiClient.post("canvases", request);
  return response.data;
}

export async function getCanvasesForUser(): Promise<canvasListItem[]> {
  const response = await apiClient.get("canvases");
  return response.data;
}

export async function deleteCanvas(id: string): Promise<unknown> {
  const response = await apiClient.delete(`canvases/${id}`);
  return response.data;
}

export async function getCanvas(id: string): Promise<Canvas> {
  const response = await apiClient.get(`canvases/${id}`);
  return response.data;
}

export async function updateCanvas(canvas: Canvas): Promise<Canvas> {
  const request: UpdateCanvasRequest = {
    data: canvas.data,
    elements: canvas.elements,
  };
  const response = await apiClient.put(`canvases/${canvas.id}`, request);
  return response.data;
}
