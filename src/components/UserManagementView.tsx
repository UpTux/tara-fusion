import React, { useMemo, useState } from 'react';
import { Organization, OrganizationRole, User } from '../types';

interface UserManagementViewProps {
    users: User[];
    organizations: Organization[];
    currentUser: User;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ users, organizations, currentUser }) => {
    const [selectedOrgId] = useState<string | null>(organizations[0]?.id || null);

    const isCurrentUserOrgAdmin = useMemo(() => {
        return currentUser.role === OrganizationRole.ORG_ADMIN;
    }, [currentUser]);

    const usersInSelectedOrg = useMemo(() => {
        if (!selectedOrgId) return [];
        return users.filter(u => u.organizationId === selectedOrgId);
    }, [selectedOrgId, users]);

    return (
        <div className="flex h-full text-white">
            <div className="flex-1 overflow-y-auto p-8">
                {selectedOrgId ? (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-200 mb-6">Users in {organizations.find(o => o.id === selectedOrgId)?.name}</h2>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700/30">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3 w-48">Organization Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersInSelectedOrg.map(user => (
                                    <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                                        <td className="p-3 font-medium">{user.name}</td>
                                        <td className="p-3 text-gray-400">{user.email}</td>
                                        <td className="p-3">
                                            <span className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-sm">
                                                {user.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!isCurrentUserOrgAdmin && (
                            <div className="mt-4 text-gray-400 text-sm">
                                <p>You must be an Organization Admin to manage users.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <h3 className="text-lg">No Organization</h3>
                            <p>No organization available.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
