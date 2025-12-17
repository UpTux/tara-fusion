import React from "react";
import { Navigate } from "react-router-dom";
import { UserAuth } from "../auth/AuthContext";

export const PrivateRoute = ({ children }) => {
  const { session } = UserAuth();

  if (session === undefined) {
    // You can render a loading spinner or placeholder here while checking auth status
    return <div>Loading...</div>;
  }

  return <>{session ? <>{children}</> : <Navigate to="/signin" />}</>;
};
