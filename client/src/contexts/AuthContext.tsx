// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "./FireBase";
import {
  createSession,
  checkSession,
  deleteSession,
} from "../api/services/UsersService";
import { User } from "@/types/User";
import { LoginRequest } from "@/types/requests/LoginRequest";
import { ApiError, ErrorType } from "../api/apiClient";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // USERS/LOGOUT (LOGOUT)
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await deleteSession();
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, still reset the user state and navigate to login
      setUser(null);
      navigate("/login");
    }
  }, [navigate]);

  // EVENT TO CATCH UNAUTHORIZED ACCESS FROM APICLIENT INTERCEPTOR
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  // USERS/SESSION (LOGIN and CREATE COOKIE)
  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const loginRequest: LoginRequest = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName ?? "No name",
        email: firebaseUser.email ?? "",
        avatarUrl: firebaseUser.photoURL ?? "",
        idToken: idToken,
        userAgent: navigator.userAgent,
        // IP will be determined server-side
      };

      const { user: serverUser } = await createSession(loginRequest);
      setUser(serverUser);

      // Navigate to canvas selection after successful login
      //navigate("/canvas-selection");
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.type === ErrorType.AUTH) {
        toast.error("Authentication failed. Please try again.");
      } else {
        toast.error("Login failed. Please try again later.");
      }
      console.error("Login failed:", error);
    }
  };

  // USERS/ME (HYDRATE USER)
  useEffect(() => {
    const verifySession = async () => {
      setIsLoading(true);
      try {
        // Skip session check if on login page
        if (window.location.pathname === "/login") {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const userData = await checkSession();
        setUser(userData); // checkSession now returns null for auth failures
      } catch (error) {
        // We only get non-auth errors here since auth errors return null
        console.error(
          "Session verification failed with unexpected error:",
          error
        );
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
