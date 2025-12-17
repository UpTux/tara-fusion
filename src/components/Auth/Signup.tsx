import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import React from "react";
import { UserAuth } from "./AuthContext";
import { ShowPasswordIcon } from "../icons/showPasswordIcon";
import { HidePasswordIcon } from "../icons/HidePasswordIcon";

export default function Signup() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUpNewUser(email.toLowerCase(), password);
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error?.message || "Sign up failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen ">
      <form onSubmit={handleSignUp} className="max-w-md m-auto w-4/5">
        <h1 className="text-2xl mb-6 font-bold">Sign Up</h1>
        <div className="flex flex-col gap-6">
          <input
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-vscode-bg-input border border-vscode-border rounded-lg text-vscode-text-primary focus:outline-none focus:ring-2 focus:ring-vscode-accent"
            type="email"
            placeholder="Email"
            required
          />
          <div className="relative">
            <input
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-vscode-bg-input border border-vscode-border rounded-lg text-vscode-text-primary focus:outline-none focus:ring-2 focus:ring-vscode-accent pr-12"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-vscode-text-secondary hover:text-vscode-text-primary transition-colors"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />}
            </button>
          </div>
          <div className="relative">
            <input
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-vscode-bg-input border border-vscode-border rounded-lg text-vscode-text-primary focus:outline-none focus:ring-2 focus:ring-vscode-accent pr-12"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-vscode-text-secondary hover:text-vscode-text-primary transition-colors"
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <HidePasswordIcon />
              ) : (
                <ShowPasswordIcon />
              )}
            </button>
          </div>
          <button
            className="px-4 py-2 mb-2 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50"
            type="submit"
            disabled={loading}
          >
            Sign Up
          </button>
        </div>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <p>
          Already have an account?{" "}
          <Link className="text-blue-500" to="/signin">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
