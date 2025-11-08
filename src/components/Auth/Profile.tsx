import { useAuth0 } from "@auth0/auth0-react";

export const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="loading-text">Loading profile...</div>;
  }

  return (
    isAuthenticated && user ? (
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name || 'User'}
            className="profile-picture"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #63b3ed'
            }}
          />
        )}
        <div style={{ textAlign: 'left' }}>
          <div className="font-semibold text-indigo-300" >
            {user.name}
          </div>
        </div>
      </div>
    ) : null
  );
};

