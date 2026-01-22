import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEMO_USER_STORAGE_KEY = "cateringku_demo_user";
const isStaticMode = import.meta.env.VITE_STATIC_MODE === "true";

const loadDemoUser = (): User | null => {
  if (!isStaticMode) return null;
  try {
    const raw = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed as User;
  } catch {
    return null;
  }
};

const saveDemoUser = (user: User | null) => {
  if (!isStaticMode) return;
  if (!user) {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    return;
  }
  localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    if (isStaticMode) {
      setUser(loadDemoUser());
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (userData: User) => {
    setUser(userData);
    saveDemoUser(userData);
  };

  const logout = async () => {
    if (isStaticMode) {
      saveDemoUser(null);
      setUser(null);
      localStorage.removeItem("cateringku_cart");
      return;
    }
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
      // Also clear cart on logout for security
      localStorage.removeItem("cateringku_cart");
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
