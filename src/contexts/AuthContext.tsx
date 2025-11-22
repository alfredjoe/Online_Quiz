import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

type UserRole = "student" | "teacher" | "admin" | null;

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event);
        console.log("Session:", session);
        setSession(session);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || "User",
            email: session.user.email || "",
            role: (session.user.user_metadata?.role as UserRole) || "student",
          });
          setIsLoading(false);
          
          setTimeout(async () => {
            try {
              const { data, error } = await supabase.rpc('get_user_role', {
                user_id: session.user.id
              });
              
              if (error) {
                console.error('Error fetching user role:', error);
              } else if (data) {
                setUser(prevUser => ({
                  ...prevUser!,
                  role: data as UserRole,
                }));
              }
            } catch (err) {
              console.error('Error in auth state change:', err);
            }
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    const initAuth = async () => {
      console.log("Initializing auth...");
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session:", session);
        setSession(session);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || "User",
            email: session.user.email || "",
            role: (session.user.user_metadata?.role as UserRole) || "student",
          });
          
          try {
            const { data, error } = await supabase.rpc('get_user_role', {
              user_id: session.user.id
            });
            
            if (error) {
              console.error('Error fetching user role:', error);
            } else if (data) {
              setUser(prevUser => ({
                ...prevUser!,
                role: data as UserRole,
              }));
            }
          } catch (err) {
            console.error('Error fetching user details:', err);
          }
        }
      } catch (err) {
        console.error('Error in init auth:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("Attempting login with:", email);
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Auth state change will handle setting the user
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
      toast.error(err.message || "An error occurred during login");
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    console.log("Attempting registration with:", email, role);
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: existingUsers, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .limit(1);
      
      if (lookupError) {
        console.error('Error checking email:', lookupError);
      }
      
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('An account with this email already exists');
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      toast.success("Registration successful!");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration");
      toast.error(err.message || "An error occurred during registration");
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log("Attempting password reset for:", email);
    setIsLoading(true);
    setError(null);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      console.log('Reset password redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Password reset link sent to your email");
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.message || "An error occurred while sending reset password link");
      toast.error(err.message || "An error occurred while sending reset password link");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("Logging out...");
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err: any) {
      console.error("Error logging out:", err);
      toast.error("Error logging out");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error, register }}>
      {children}
    </AuthContext.Provider>
  );
};
