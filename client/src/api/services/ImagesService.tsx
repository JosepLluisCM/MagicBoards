import apiClient from "../apiClient";

export async function uploadImage(imageFile: File, id?: string): Promise<string> {
  const formData = new FormData();
  formData.append("image", imageFile);
  if (id) formData.append("canvasId", id);

  const response = await apiClient.post("images/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.imagePath;
}

export async function getImage(imagePath: string): Promise<string> {
  const response = await apiClient.get(`images/${encodeURIComponent(imagePath)}`, {
    responseType: "blob",
  });
  return URL.createObjectURL(response.data);
}

export async function deleteImage(imagePath: string): Promise<unknown> {
  const response = await apiClient.delete(`images/${encodeURIComponent(imagePath)}`);
  return response.data;
}
