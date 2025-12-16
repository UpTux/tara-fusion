import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import React from "react";
import { UserAuth } from "./AuthContext";

export default function Signin() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInUser(email.toLowerCase(), password);
      if (result.success) {
        navigate("/");
      } else {
        setError("Error: " + result.error.message);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen ">
      <form onSubmit={handleSignIn} className="max-w-md m-auto w-4/5">
        <h1 className="text-2xl mb-6 font-bold">Sign In</h1>
        <div className="flex flex-col gap-6">
          <input
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-vscode-bg-input border border-vscode-border rounded-lg text-vscode-text-primary focus:outline-none focus:ring-2 focus:ring-vscode-accent"
            type="text"
            placeholder="Email"
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-vscode-bg-input border border-vscode-border rounded-lg text-vscode-text-primary focus:outline-none focus:ring-2 focus:ring-vscode-accent"
            type="password"
            placeholder="Password"
          />
          <button
            className="px-4 py-2 mb-2 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50"
            type="submit"
            disabled={loading}
          >
            Sign In
          </button>
        </div>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <p>
          don't have an account?{" "}
          <Link className="text-blue-500" to="/signup">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
