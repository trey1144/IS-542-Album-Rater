import { createContext, useEffect, useState, useContext, type ReactNode } from "react";
import { supabase } from "../utils/supabase";

type AuthContextType = {
  session: any;
  isAuthLoading: boolean;
  signUpNewUser: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  signInUser: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContextProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const signUpNewUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error signing up:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  };

  const signInUser = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error signing in:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error("Error signing in:", error);
      return { success: false, error: error?.message ?? "Unknown error" };
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
      } catch (error) {
        console.error("Error loading auth session:", error);
        setSession(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, isAuthLoading, signUpNewUser, signInUser, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("UserAuth must be used within an AuthContextProvider");
  }
  return context;
};
