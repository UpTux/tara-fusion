import { createContext, useEffect, useState, useContext, ReactNode } from "react";
import { supabase } from "./supabaseClient";
import { Session, AuthError } from "@supabase/supabase-js";

interface AuthResponse {
  success: boolean;
  data?: any;
  error?: AuthError;
}

interface AuthContextType {
  session: Session | null | undefined;
  signUpNewUser: (email: string, password: string) => Promise<AuthResponse>;
  signInUser: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  // sign up
  const signUpNewUser = async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      //console.log("Error signing up:", error.message);
      return { success: false, error };
    }
    return { success: true, data };
  };

  // sign in
  const signInUser = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        //console.log("Error signing in:", error.message);
        return { success: false, error };
      }
      return { success: true, data };
    } catch (error) {
      //console.log("An error occurred:", error.message);
      return { success: false, error: error as AuthError };
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      //console.log("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, signUpNewUser, signInUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("UserAuth must be used within AuthContextProvider");
  }
  return context;
};
