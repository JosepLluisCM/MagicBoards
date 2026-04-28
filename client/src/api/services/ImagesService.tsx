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

export async function getImage(
  imagePath: string,
  cacheBuster?: string
): Promise<string> {
  // Server route ignores the query string, but Axios + the browser HTTP cache
  // see it as a distinct URL — used by callers (e.g. canvas previews) that
  // need to bypass the 1-day cache when the path is fixed but content changed.
  const url = `images/${encodeURIComponent(imagePath)}${
    cacheBuster ? `?v=${encodeURIComponent(cacheBuster)}` : ""
  }`;
  const response = await apiClient.get(url, { responseType: "blob" });
  return URL.createObjectURL(response.data);
}

export async function deleteImage(imagePath: string): Promise<unknown> {
  const response = await apiClient.delete(`images/${encodeURIComponent(imagePath)}`);
  return response.data;
}
