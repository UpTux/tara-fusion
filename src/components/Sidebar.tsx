


import React from 'react';
import { Organization, Project, User, OrganizationMembership, ProjectMembership } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { UsersIcon } from './icons/UsersIcon';
import { FolderIcon } from './icons/FolderIcon';
import { CurrentUserSelector } from './CurrentUserSelector';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { calculatePermissions } from '../services/permissionService';

interface SidebarProps {
  organizations: Organization[];
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (organizationId: string) => void;
  onCreateProjectFromFile: (jsonString: string, organizationId: string) => void;
  onDeleteProject: (projectId: string) => void;
  users: User[];
  currentUser: User;
  onSelectUser: (userId: string) => void;
  activeView: 'projects' | 'users';
  onSelectView: (view: 'projects' | 'users') => void;
  orgMemberships: OrganizationMembership[];
  projectMemberships: ProjectMembership[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  organizations,
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onCreateProjectFromFile,
  onDeleteProject,
  users,
  currentUser,
  onSelectUser,
  activeView,
  onSelectView,
  orgMemberships,
  projectMemberships,
}) => {
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>, organizationId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        onCreateProjectFromFile(content, organizationId);
      } catch (error) {
        console.error('Failed to read project file:', error);
        alert('Failed to read project file.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input to allow re-uploading the same file
  };

  return (
    <aside className="w-72 bg-gray-900/80 border-r border-gray-700/50 flex flex-col">
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h1 className="text-xl font-bold text-white">TARA Fusion</h1>
        </div>
      </div>
      
      <div className="px-4 pb-2 border-b border-gray-700/50">
        <div className="flex bg-gray-800/50 rounded-lg p-1">
            <button 
                onClick={() => onSelectView('projects')}
                className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center justify-center ${activeView === 'projects' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
                <FolderIcon className="w-5 h-5 mr-2" /> Projects
            </button>
            <button 
                onClick={() => onSelectView('users')}
                className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center justify-center ${activeView === 'users' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
                <UsersIcon className="w-5 h-5 mr-2" /> Users
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeView === 'projects' ? (
          <>
            {organizations.map((org) => (
              <div key={org.id} className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{org.name}</h2>
                  <div className="flex items-center space-x-2">
                    <label
                      className="text-gray-500 hover:text-indigo-400 transition-colors cursor-pointer"
                      title={`Create project from file in ${org.name}`}
                    >
                      <UploadIcon className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept=".json"
                        onChange={(e) => handleFileImport(e, org.id)}
                      />
                    </label>
                    <button 
                      onClick={() => onAddProject(org.id)}
                      className="text-gray-500 hover:text-indigo-400 transition-colors"
                      title={`Add project to ${org.name}`}
                    >
                       <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <ul className="space-y-1">
                  {projects
                    .filter((p) => p.organizationId === org.id)
                    .map((proj) => {
                      const permissions = calculatePermissions(currentUser.id, proj, orgMemberships, projectMemberships);
                      return (
                      <li key={proj.id} className="group flex items-center justify-between rounded-md transition-colors hover:bg-gray-800/30">
                        <button
                          onClick={() => onSelectProject(proj.id)}
                          className={`flex-grow text-left px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            activeProjectId === proj.id
                              ? 'bg-indigo-600 text-white shadow-lg'
                              : 'text-gray-300 group-hover:bg-gray-700/50 group-hover:text-white'
                          }`}
                        >
                          {proj.name}
                        </button>
                        {permissions.isProjectAdmin && (
                            <button
                                onClick={() => onDeleteProject(proj.id)}
                                className="ml-1 mr-1 p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 flex-shrink-0"
                                title={`Delete ${proj.name}`}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                      </li>
                    )})}
                </ul>
              </div>
            ))}
          </>
        ) : (
             <div className="p-4 text-center text-gray-500 text-sm">
                <p>User Management is active.</p>
                <p className="mt-2">Use the main panel to manage users for each organization.</p>
            </div>
        )}
      </div>
      
      <CurrentUserSelector users={users} currentUser={currentUser} onSelectUser={onSelectUser} />
    </aside>
  );
};
