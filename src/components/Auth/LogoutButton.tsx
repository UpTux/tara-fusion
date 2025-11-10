import { useAuth0 } from "@auth0/auth0-react";
import { useTranslation } from "react-i18next";

export const LogoutButton = () => {
  const { logout } = useAuth0();
  const { t } = useTranslation();
  return (
    <button
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="px-4 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 border border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50 disabled:bg-transparent"
    >
      {t('logout')}
    </button>
  );
};

