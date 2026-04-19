import apiClient, { ApiError, ErrorType } from "../apiClient";
import { LoginRequest } from "@/types/requests/LoginRequest";
import { User } from "@/types/User";

export async function createSession(request: LoginRequest): Promise<{ user: User }> {
  // Cookie is set in the response
  const response = await apiClient.post("users/session", request);
  return response.data;
}

export async function checkSession(): Promise<User | null> {
  try {
    const response = await apiClient.get("users/me", {
      headers: { "X-Auth-Check": "true" },
    });
    return response.data;
  } catch (error) {
    if ((error as ApiError).type === ErrorType.AUTH) return null;
    throw error;
  }
}

export async function deleteSession(): Promise<void> {
  try {
    await apiClient.post("users/logout", null, {
      headers: { "X-Logout-Flow": "true" },
    });
  } catch {
    // Ignore logout failures — session is cleared client-side regardless
  }
}
