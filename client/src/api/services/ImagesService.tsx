import apiClient from "../apiClient";
//import { Canvas } from "../../types";

export async function uploadImage(imageFile: File, userId?: string) {
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append("image", imageFile);

  // Add userId to formData if provided
  if (userId) {
    formData.append("id", userId);
  }

  // Send the image to the server
  const response = await apiClient.post("api/images/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.imagePath;
}
