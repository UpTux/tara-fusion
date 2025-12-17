import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);

  // sign up
  const signUpNewUser = async (email, password) => {
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
  const signInUser = async (email, password) => {
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
      return { success: false, error };
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

export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("UserAuth must be used within AuthContextProvider");
  }
  return context;
};
