import apiClient from "../apiClient";
import { Canvas } from "@/types/canvas";
import { canvasListItem } from "@/types/CanvasListItem";
import { CreateCanvasRequest } from "@/types/requests/CreateCanvasRequest";
import { UpdateCanvasRequest } from "@/types/requests/UpdateCanvasRequest";

/**
 * Creates a new canvas
 * @param request Canvas creation request data
 * @returns The created canvas object
 */
export async function createCanvas(
  request: CreateCanvasRequest
): Promise<Canvas> {
  try {
    const response = await apiClient.post("canvases", request);
    return response.data;
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}

/**
 * Fetches all canvases for the current user
 * @returns Array of canvas list items
 */
export async function getCanvasesForUser(): Promise<canvasListItem[]> {
  try {
    const response = await apiClient.get("canvases");
    return response.data;
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}

/**
 * Deletes a canvas by ID
 * @param id Canvas ID to delete
 * @returns Server response data
 */
export async function deleteCanvas(id: string): Promise<any> {
  try {
    const response = await apiClient.delete(`canvases/${id}`);
    return response.data;
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}

/**
 * Fetches a single canvas by ID
 * @param id Canvas ID to fetch
 * @returns Canvas object
 */
export async function getCanvas(id: string): Promise<Canvas> {
  try {
    const response = await apiClient.get(`canvases/${id}`);
    return response.data;
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}

/**
 * Updates an existing canvas
 * @param canvas Canvas object with updated data
 * @returns Updated canvas object
 */
export async function updateCanvas(canvas: Canvas): Promise<Canvas> {
  try {
    const request: UpdateCanvasRequest = {
      data: canvas.data,
      elements: canvas.elements,
    };

    const response = await apiClient.put(`canvases/${canvas.id}`, request);
    return response.data;
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}
