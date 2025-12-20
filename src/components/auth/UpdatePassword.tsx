import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "./AuthContext";
import { HidePasswordIcon } from "../icons/HidePasswordIcon";
import { ShowPasswordIcon } from "../icons/ShowPasswordIcon";

export default function UpdatePassword() {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const { updatePassword, isPasswordRecovery } = UserAuth();
  const navigate = useNavigate();

  // Guard: Check if user is in PASSWORD_RECOVERY state
  useEffect(() => {
    // Give auth context time to detect recovery state
    const timer = setTimeout(() => {
      if (isPasswordRecovery) {
        setIsAuthorized(true);
      } else {
        // Not in PASSWORD_RECOVERY state, redirect to signin
        navigate("/signin");
      }
      setAuthChecking(false);
    }, 500); // Small delay to allow AuthContext useEffect to run

    return () => clearTimeout(timer);
  }, [isPasswordRecovery, navigate]);

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      if (result.success) {
        setSuccess(true);
        // Redirect to signin after 2 seconds
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        setError("Error: " + (result.error?.message || "Failed to update password"));
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authorization
  if (authChecking || !isAuthorized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-vscode-text-secondary">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleUpdatePassword} className="max-w-md m-auto w-4/5">
        <h1 className="text-2xl mb-6 font-bold">Set New Password</h1>

        {success && (
          <div className="mb-4 p-3 bg-green-600/20 border border-green-600 text-green-400 rounded-md">
            Password updated successfully! Redirecting to sign in...
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* New Password */}
          <div className="relative">
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="w-full px-4 py-2 bg-vscode-bg-input border border-vscode-border rounded-lg text-vscode-text-primary focus:outline-none focus:ring-2 focus:ring-vscode-accent"
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-vscode-text-secondary hover:text-vscode-text-primary"
            >
              {showPassword ? <HidePasswordIcon className="w-5 h-5" /> : <ShowPasswordIcon className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              className="w-full px-4 py-2 bg-vscode-bg-input border border-vscode-border rounded-lg text-vscode-text-primary focus:outline-none focus:ring-2 focus:ring-vscode-accent"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2.5 text-vscode-text-secondary hover:text-vscode-text-primary"
            >
              {showConfirmPassword ? <HidePasswordIcon className="w-5 h-5" /> : <ShowPasswordIcon className="w-5 h-5" />}
            </button>
          </div>

          <button
            className="px-4 py-2 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50"
            type="submit"
            disabled={loading || success}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>

        {error && <p className="text-red-600 mt-4">{error}</p>}
      </form>
    </div>
  );
}
