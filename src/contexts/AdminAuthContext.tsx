import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has admin role
  const checkAdminRole = async (userId: string): Promise<{ isAdmin: boolean; error?: string }> => {
    try {
      console.log("Checking admin role for user:", userId);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        return { isAdmin: false, error: error.message };
      }

      console.log("Admin role check result:", data);
      return { isAdmin: !!data };
    } catch (error) {
      console.error("Error checking admin role:", error);
      return { isAdmin: false, error: "Erro ao verificar permissões" };
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer admin check to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id).then((result) => setIsAdmin(result.isAdmin));
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id).then((result) => {
          setIsAdmin(result.isAdmin);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("Attempting login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Auth error:", error);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Erro ao fazer login" };
      }

      console.log("User authenticated, checking admin role...");
      
      // Check if user is admin
      const adminCheck = await checkAdminRole(data.user.id);
      
      if (adminCheck.error) {
        console.error("Admin check error:", adminCheck.error);
        await supabase.auth.signOut();
        return { success: false, error: adminCheck.error };
      }
      
      if (!adminCheck.isAdmin) {
        // Sign out if not admin
        await supabase.auth.signOut();
        return { success: false, error: "Acesso não autorizado. Apenas administradores podem acessar." };
      }

      setIsAdmin(true);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Erro de conexão" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AdminAuthContext.Provider 
      value={{ 
        isAuthenticated: !!session && isAdmin, 
        isAdmin,
        user,
        login, 
        logout, 
        isLoading 
      }}
    >
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
