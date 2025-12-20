import { createContext, useEffect, useState, useContext, ReactNode } from "react";
import { supabase } from "./supabaseClient";
import { Session, AuthError, AuthChangeEvent } from "@supabase/supabase-js";

interface AuthResponse {
  success: boolean;
  data?: any;
  error?: AuthError;
}

interface AuthContextType {
  session: Session | null | undefined;
  authEvent: AuthChangeEvent | null;
  isPasswordRecovery: boolean;
  signUpNewUser: (email: string, password: string) => Promise<AuthResponse>;
  signInUser: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  updatePassword: (password: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [authEvent, setAuthEvent] = useState<AuthChangeEvent | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthEvent(event);
        setSession(session);
        
        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordRecovery(true);
        } 
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      //console.log("Error signing out:", error);
    }
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      return { success: false, error };
    }
    return { success: true, data };
  };

  const updatePassword = async (password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });
    if (error) {
      return { success: false, error };
    }
    // Clear the PASSWORD_RECOVERY flag after successful update
    setIsPasswordRecovery(false);
    return { success: true, data };
  };

  return (
    <AuthContext.Provider
      value={{ 
        session, 
        authEvent,
        isPasswordRecovery,
        signUpNewUser, 
        signInUser, 
        signOut, 
        resetPassword,
        updatePassword
      }}
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
