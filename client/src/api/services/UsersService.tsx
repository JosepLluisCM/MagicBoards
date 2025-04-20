import apiClient, { ApiError, ErrorType } from "../apiClient";
import { LoginRequest } from "@/types/requests/LoginRequest";
import { User } from "@/types/User";
//import { UserSession } from "@/types/UserSession";

// export async function createSession(
//   request: LoginRequest
// ): Promise<{ user: User; session: UserSession }> {
//   try {
//     // the cookie is set in the response
//     const response = await apiClient.post("users/session", request);
//     return response.data;
//   } catch (error) {
//     console.error("Failed to create session:", error);
//     throw error;
//   }
// }

/**
 * Creates a user session
 * @param request Login request data
 * @returns Object containing user data
 */
export async function createSession(
  request: LoginRequest
): Promise<{ user: User }> {
  try {
    // Cookie is set in the response
    const response = await apiClient.post("users/session", request);
    return response.data;
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}

/**
 * Checks if the user has a valid session
 * @returns User data if session is valid, null if not authenticated
 */
export async function checkSession(): Promise<User | null> {
  try {
    const response = await apiClient.get("users/me", {
      headers: {
        "X-Auth-Check": "true",
      },
    });
    return response.data;
  } catch (error) {
    // For auth errors (401), return null instead of throwing
    if ((error as ApiError).type === ErrorType.AUTH) {
      return null;
    }
    // For all other errors, propagate
    throw error;
  }
}

/**
 * Ends the user session
 */
export async function deleteSession(): Promise<void> {
  try {
    await apiClient.post("users/logout", null, {
      headers: {
        "X-Logout-Flow": "true", // Add this header
      },
    });
  } catch (error) {
    // Even if logout fails, we don't want to throw an error
    // API client already handles logging
    console.info("Logout completed (client-side)");
  }
}
