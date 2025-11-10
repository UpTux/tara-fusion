import React from 'react';
import { User } from '../types';

interface CurrentUserSelectorProps {
  users: User[];
  currentUser: User;
  onSelectUser: (userId: string) => void;
}

export const CurrentUserSelector: React.FC<CurrentUserSelectorProps> = ({ users, currentUser, onSelectUser }) => {
  return (
    <div className="p-4 border-t border-vscode-border">
      <label htmlFor="user-selector" className="block text-xs font-medium text-vscode-text-secondary mb-2">
        Current User (for demo)
      </label>
      <select
        id="user-selector"
        value={currentUser.id}
        onChange={(e) => onSelectUser(e.target.value)}
        className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-vscode-text-primary"
      >
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  );
};
