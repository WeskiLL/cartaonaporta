import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; remainingAttempts?: number; blockedMinutes?: number }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  checkLoginBlocked: (email: string) => Promise<{ blocked: boolean; remainingAttempts: number; blockedMinutes: number }>;
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
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role");
        return { isAdmin: false, error: error.message };
      }

      return { isAdmin: !!data };
    } catch (error) {
      console.error("Error checking admin role");
      return { isAdmin: false, error: "Erro ao verificar permissões" };
    }
  };

  // Check if login is blocked for an email
  const checkLoginBlocked = async (email: string): Promise<{ blocked: boolean; remainingAttempts: number; blockedMinutes: number }> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if blocked
      const { data: blockedData, error: blockedError } = await supabase
        .rpc('is_login_blocked', { check_email: normalizedEmail });
      
      if (blockedError) {
        console.error("Error checking login blocked:", blockedError);
        return { blocked: false, remainingAttempts: 10, blockedMinutes: 0 };
      }

      // Get remaining attempts
      const { data: attemptsData } = await supabase
        .rpc('get_remaining_login_attempts', { check_email: normalizedEmail });
      
      // Get unblock time if blocked
      let blockedMinutes = 0;
      if (blockedData) {
        const { data: timeData } = await supabase
          .rpc('get_unblock_time_minutes', { check_email: normalizedEmail });
        blockedMinutes = timeData || 0;
      }

      return {
        blocked: !!blockedData,
        remainingAttempts: attemptsData || 0,
        blockedMinutes
      };
    } catch (error) {
      console.error("Error checking login status:", error);
      return { blocked: false, remainingAttempts: 10, blockedMinutes: 0 };
    }
  };

  // Record login attempt
  const recordLoginAttempt = async (email: string, success: boolean) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      await supabase
        .from('login_attempts')
        .insert({
          email: normalizedEmail,
          success
        });
    } catch (error) {
      console.error("Error recording login attempt:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    console.log('AdminAuthContext: Initializing...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        console.log('AdminAuthContext: Auth state changed', { event, hasSession: !!session });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer admin check to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            if (isMounted) {
              console.log('AdminAuthContext: Checking admin role for', session.user.email);
              checkAdminRole(session.user.id).then((result) => {
                if (isMounted) {
                  console.log('AdminAuthContext: Admin check result', result);
                  setIsAdmin(result.isAdmin);
                  setIsLoading(false);
                }
              });
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      console.log('AdminAuthContext: Got existing session', { hasSession: !!session, email: session?.user?.email });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('AdminAuthContext: Checking admin role for existing session');
        checkAdminRole(session.user.id).then((result) => {
          if (isMounted) {
            console.log('AdminAuthContext: Admin check result for existing session', result);
            setIsAdmin(result.isAdmin);
            setIsLoading(false);
          }
        });
      } else {
        console.log('AdminAuthContext: No existing session');
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; remainingAttempts?: number; blockedMinutes?: number }> => {
    try {
      // Check if login is blocked
      const blockStatus = await checkLoginBlocked(email);
      
      if (blockStatus.blocked) {
        return { 
          success: false, 
          error: `Muitas tentativas de login. Tente novamente em ${blockStatus.blockedMinutes} minutos.`,
          blockedMinutes: blockStatus.blockedMinutes
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Auth error");
        // Record failed attempt
        await recordLoginAttempt(email, false);
        
        // Get updated remaining attempts
        const updatedStatus = await checkLoginBlocked(email);
        
        return { 
          success: false, 
          error: error.message,
          remainingAttempts: updatedStatus.remainingAttempts
        };
      }

      if (!data.user) {
        await recordLoginAttempt(email, false);
        return { success: false, error: "Erro ao fazer login" };
      }

      // Check if user is admin
      const adminCheck = await checkAdminRole(data.user.id);
      
      if (adminCheck.error) {
        console.error("Admin check error");
        await supabase.auth.signOut();
        await recordLoginAttempt(email, false);
        return { success: false, error: adminCheck.error };
      }
      
      if (!adminCheck.isAdmin) {
        // Sign out if not admin
        await supabase.auth.signOut();
        await recordLoginAttempt(email, false);
        return { success: false, error: "Acesso não autorizado. Apenas administradores podem acessar." };
      }

      // Record successful login
      await recordLoginAttempt(email, true);
      
      setIsAdmin(true);
      return { success: true };
    } catch (error) {
      console.error("Login error");
      await recordLoginAttempt(email, false);
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
        isLoading,
        checkLoginBlocked
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
