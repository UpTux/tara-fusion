import { Link } from "react-router-dom";
import { useState } from "react";
import React from "react";
import { UserAuth } from "./AuthContext";

export default function ResetPassword() {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const { resetPassword } = UserAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await resetPassword(email.toLowerCase());
      if (result.success) {
        setSuccess(true);
        setEmail(""); // Clear form
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError("Error: " + result.error?.message);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen ">
      <form onSubmit={handleResetPassword} className="max-w-md m-auto w-4/5">
        <h1 className="text-2xl mb-6 font-bold">Reset Password</h1>
        
        {success && (
          <div className="mb-4 p-3 bg-green-600/20 border border-green-600 text-green-400 rounded-md">
            Check your email for the password reset link!
          </div>
        )}

        <div className="flex flex-col gap-6">
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className="w-full px-4 py-2 bg-vscode-bg-input border border-vscode-border rounded-lg text-vscode-text-primary focus:outline-none focus:ring-2 focus:ring-vscode-accent"
            type="email"
            placeholder="Email"
            required
            disabled={loading || success}
          />
          <button
            className="px-4 py-2 mb-2 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50"
            type="submit"
            disabled={loading || success}
          >
            {loading ? "Sending..." : "Reset your Password"}
          </button>
        </div>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <p>
          Remember your password?
          <Link className="text-blue-500 ml-2" to="/signin">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
