import React, { useState, useMemo } from 'react';
import { Organization, User, OrganizationMembership, OrganizationRole } from '../types';
import { getOrganizationMembership } from '../services/permissionService';
import { TrashIcon } from './icons/TrashIcon';

interface UserManagementViewProps {
    users: User[];
    organizations: Organization[];
    orgMemberships: OrganizationMembership[];
    setOrgMemberships: React.Dispatch<React.SetStateAction<OrganizationMembership[]>>;
    currentUser: User;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ users, organizations, orgMemberships, setOrgMemberships, currentUser }) => {
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(organizations[0]?.id || null);

    const isCurrentUserOrgAdmin = useMemo(() => {
        if (!selectedOrgId) return false;
        const membership = getOrganizationMembership(currentUser.id, selectedOrgId, orgMemberships);
        return membership?.role === OrganizationRole.ORG_ADMIN;
    }, [currentUser, selectedOrgId, orgMemberships]);
    
    const usersInSelectedOrg = useMemo(() => {
        if (!selectedOrgId) return [];
        return orgMemberships
            .filter(om => om.organizationId === selectedOrgId)
            .map(om => {
                const user = users.find(u => u.id === om.userId);
                return { ...user, role: om.role };
            })
            .filter(u => u.id); // Filter out potential undefined users
    }, [selectedOrgId, orgMemberships, users]);
    
    const handleRoleChange = (userId: string, newRole: OrganizationRole) => {
        if (!selectedOrgId) return;
        setOrgMemberships(prev => prev.map(om => 
            om.organizationId === selectedOrgId && om.userId === userId ? { ...om, role: newRole } : om
        ));
    };

    const handleRemoveUser = (userId: string) => {
        if (!selectedOrgId) return;

        const orgAdmins = usersInSelectedOrg.filter(u => u.role === OrganizationRole.ORG_ADMIN);
        const userToRemove = usersInSelectedOrg.find(u => u.id === userId);
        if (userToRemove?.role === OrganizationRole.ORG_ADMIN && orgAdmins.length <= 1) {
            alert('Cannot remove the last Organization Admin.');
            return;
        }

        if (window.confirm(`Are you sure you want to remove ${userToRemove?.name} from this organization?`)) {
            setOrgMemberships(prev => prev.filter(om => !(om.organizationId === selectedOrgId && om.userId === userId)));
        }
    };

    return (
        <div className="flex h-full text-white">
            <div className="w-1/3 border-r border-gray-700/50 flex flex-col">
                <div className="p-4 border-b border-gray-700/50">
                    <h2 className="text-lg font-semibold">Organizations</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ul className="p-2 space-y-1">
                        {organizations.map(org => (
                            <li key={org.id}>
                                <button
                                    onClick={() => setSelectedOrgId(org.id)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedOrgId === org.id ? 'bg-indigo-600/30 text-indigo-200 font-semibold' : 'text-gray-300 hover:bg-gray-700/50'}`}
                                >
                                    {org.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="w-2/3 flex-1 overflow-y-auto p-8">
                {selectedOrgId ? (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-200 mb-6">Manage Users for {organizations.find(o => o.id === selectedOrgId)?.name}</h2>
                        {isCurrentUserOrgAdmin ? (
                             <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700/30">
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3 w-48">Organization Role</th>
                                        <th className="p-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersInSelectedOrg.map(user => (
                                        <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                                            <td className="p-3 font-medium">{user.name}</td>
                                            <td className="p-3 text-gray-400">{user.email}</td>
                                            <td className="p-3">
                                                <select 
                                                    value={user.role} 
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value as OrganizationRole)}
                                                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-sm"
                                                >
                                                    {Object.values(OrganizationRole).map(role => <option key={role} value={role}>{role}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleRemoveUser(user.id!)} className="text-red-400 hover:text-red-300 p-1" title="Remove user">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
                                <div className="text-center text-gray-500">
                                    <h3 className="text-lg font-semibold">Permission Denied</h3>
                                    <p>You must be an Organization Admin to manage users.</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <h3 className="text-lg">Select an Organization</h3>
                            <p>Choose an organization from the list to manage its users.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
