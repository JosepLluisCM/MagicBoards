import apiClient from "../apiClient";
//import { Canvas } from "../../types";

interface UploadImageRequest {
  userId?: string;
  canvasId?: string;
}

export async function uploadImage(
  imageFile: File,
  request?: UploadImageRequest
) {
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append("image", imageFile);

  // Add userId and canvasId to formData if provided
  if (request?.userId) {
    formData.append("userId", request.userId);
  }

  if (request?.canvasId) {
    formData.append("canvasId", request.canvasId);
  }

  // Send the image to the server
  const response = await apiClient.post("images/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.imagePath;
}

export async function deleteImage(imagePath: string) {
  const response = await apiClient.delete(
    `images/${encodeURIComponent(imagePath)}`
  );
  return response.data;
}
