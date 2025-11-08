import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

export function useAuthenticatedUser() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      getAccessTokenSilently()
        .then(token => setAccessToken(token))
        .catch(console.error);
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading
  };
}