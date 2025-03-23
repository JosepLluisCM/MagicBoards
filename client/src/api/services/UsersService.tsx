import apiClient from "../apiClient";
import { User } from "../../types";

export async function fetchUser(userId: string): Promise<User> {
  const response = await apiClient.get(`users/${userId}`);
  return {
    ...response.data,
    createdAt: new Date(response.data.createdAt),
    updatedAt: new Date(response.data.updatedAt),
  };
}
