import apiClient from "../../apiClient";

export async function fetchData() {
  const response = await apiClient.get("Firestore/documents");
  return response.data; // Return the relevant data
}
