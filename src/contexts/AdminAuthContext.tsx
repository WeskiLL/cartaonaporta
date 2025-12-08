import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = "prime_print_admin_session";

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setIsAuthenticated(true);
        setUsername(parsed.username);
      } catch {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (user: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: user, password: pass }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Erro ao fazer login" };
      }

      // Store session
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        token: data.token,
        username: data.username,
      }));

      setIsAuthenticated(true);
      setUsername(data.username);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Erro de conexão" };
    }
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, username, login, logout, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
