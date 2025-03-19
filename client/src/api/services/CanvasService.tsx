import apiClient from "../apiClient";

//export async function fetchData() {
//  const response = await apiClient.get("api/Firestore/documents");
//  return response.data; // Return the relevant data
//}

export async function createCanvas(name: string) {
  const response = await apiClient.post("canvases", { name });
  return response.data;
}

export async function getCanvases() {
  const response = await apiClient.get("canvases");
  return response.data;
}

export async function deleteCanvas(id: string) {
  const response = await apiClient.delete(`canvases/${id}`);
  return response.data;
}
