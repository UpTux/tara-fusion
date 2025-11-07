import React, { useMemo, useState } from 'react';
import { Organization, OrganizationRole, User } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface UserManagementViewProps {
    users: User[];
    organizations: Organization[];
    currentUser: User;
    onAddUser: (user: Omit<User, 'id'>) => void;
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    onDeleteUser: (userId: string) => void;
    onToggleUserActive: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
    users,
    organizations,
    currentUser,
    onAddUser,
    onUpdateUser,
    onDeleteUser,
    onToggleUserActive
}) => {
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(currentUser.organizationId || organizations[0]?.id || null);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserRole, setNewUserRole] = useState<OrganizationRole>(OrganizationRole.MEMBER);

    const isCurrentUserOrgAdmin = useMemo(() => {
        return currentUser.role === OrganizationRole.ORG_ADMIN;
    }, [currentUser]);

    const usersInSelectedOrg = useMemo(() => {
        if (!selectedOrgId) return [];
        return users.filter(u => u.organizationId === selectedOrgId);
    }, [selectedOrgId, users]);

    const selectedOrganization = useMemo(() => {
        return organizations.find(o => o.id === selectedOrgId);
    }, [selectedOrgId, organizations]);

    const handleAddUser = () => {
        if (!newUserName.trim() || !newUserEmail.trim() || !selectedOrgId) {
            alert('Please fill in all fields');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newUserEmail)) {
            alert('Please enter a valid email address');
            return;
        }

        // Check if email already exists in the organization
        const emailExists = users.some(u => u.email === newUserEmail && u.organizationId === selectedOrgId);
        if (emailExists) {
            alert('A user with this email already exists in this organization');
            return;
        }

        onAddUser({
            name: newUserName.trim(),
            email: newUserEmail.trim(),
            organizationId: selectedOrgId,
            role: newUserRole,
            active: true,
        });

        // Reset form
        setNewUserName('');
        setNewUserEmail('');
        setNewUserRole(OrganizationRole.MEMBER);
        setShowAddUserModal(false);
    };

    const handleRoleChange = (userId: string, newRole: OrganizationRole) => {
        if (userId === currentUser.id) {
            alert('You cannot change your own role!');
            return;
        }
        onUpdateUser(userId, { role: newRole });
    };

    // If not an org admin, show access denied message
    if (!isCurrentUserOrgAdmin) {
        return (
            <div className="flex h-full items-center justify-center text-white">
                <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">Access Denied</h3>
                    <p className="text-gray-400">You must be an Organization Admin to manage users.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full text-white">
            <div className="flex-1 overflow-y-auto p-8">
                {selectedOrgId ? (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-200">Users in {selectedOrganization?.name}</h2>
                                <p className="text-sm text-gray-400 mt-1">Manage users and their roles in your organization</p>
                            </div>
                            <button
                                onClick={() => setShowAddUserModal(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>Add User</span>
                            </button>
                        </div>

                        {/* Organization selector if user is admin of multiple orgs */}
                        {organizations.length > 1 && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Select Organization</label>
                                <select
                                    value={selectedOrgId || ''}
                                    onChange={(e) => setSelectedOrgId(e.target.value)}
                                    className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700/30 border-b border-gray-700/50">
                                    <tr>
                                        <th className="p-4 text-left">Name</th>
                                        <th className="p-4 text-left">Email</th>
                                        <th className="p-4 text-left">Role</th>
                                        <th className="p-4 text-left">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersInSelectedOrg.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                No users found in this organization.
                                            </td>
                                        </tr>
                                    ) : (
                                        usersInSelectedOrg.map(user => (
                                            <tr key={user.id} className="border-b border-gray-700/30 hover:bg-gray-800/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-200">{user.name}</div>
                                                    {user.id === currentUser.id && (
                                                        <span className="text-xs text-indigo-400">(You)</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-gray-400">{user.email}</td>
                                                <td className="p-4">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value as OrganizationRole)}
                                                        disabled={user.id === currentUser.id}
                                                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <option value={OrganizationRole.ORG_ADMIN}>{OrganizationRole.ORG_ADMIN}</option>
                                                        <option value={OrganizationRole.DESIGNER}>{OrganizationRole.DESIGNER}</option>
                                                        <option value={OrganizationRole.MEMBER}>{OrganizationRole.MEMBER}</option>
                                                    </select>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => onToggleUserActive(user.id)}
                                                        disabled={user.id === currentUser.id}
                                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${user.active
                                                            ? 'bg-green-900/30 text-green-400 border border-green-700/50 hover:bg-green-900/50'
                                                            : 'bg-red-900/30 text-red-400 border border-red-700/50 hover:bg-red-900/50'
                                                            }`}
                                                    >
                                                        {user.active ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => onDeleteUser(user.id)}
                                                            disabled={user.id === currentUser.id}
                                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete user"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-300 mb-2">User Management Tips</h4>
                            <ul className="text-sm text-gray-400 space-y-1">
                                <li>• <strong>Organization Admin</strong> can manage all users and projects within the organization</li>
                                <li>• <strong>Designer</strong> can create new projects and be assigned to projects with specific roles</li>
                                <li>• <strong>Member</strong> can be assigned to projects with specific project roles</li>
                                <li>• Deactivated users cannot log in but their data is preserved</li>
                                <li>• You cannot modify or delete your own user account</li>
                            </ul>
                        </div>
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

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddUserModal(false)}>
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-200 mb-4">Add New User</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    placeholder="john.doe@example.com"
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value as OrganizationRole)}
                                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value={OrganizationRole.MEMBER}>{OrganizationRole.MEMBER}</option>
                                    <option value={OrganizationRole.DESIGNER}>{OrganizationRole.DESIGNER}</option>
                                    <option value={OrganizationRole.ORG_ADMIN}>{OrganizationRole.ORG_ADMIN}</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowAddUserModal(false);
                                    setNewUserName('');
                                    setNewUserEmail('');
                                    setNewUserRole(OrganizationRole.MEMBER);
                                }}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                Add User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
