import { useAuth0 } from "@auth0/auth0-react";

export const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();
  return (
    <button
      onClick={() => loginWithRedirect()}
      className="px-4 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50"
    >
      Log In
    </button>
  );
};

