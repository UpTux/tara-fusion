import { createBrowserRouter } from "react-router-dom";
import App from "../../App";
import Signin from "@/components/auth/Signin";
import Signup from "@/components/auth/Signup";
import { PrivateRoute } from "./PrivateRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PrivateRoute>
        <App />
      </PrivateRoute>
    ),
  },
  {
    path: "/signin",
    element: <Signin />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
]);
