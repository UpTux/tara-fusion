import React from 'react';
import { Project } from '../types';

interface ProjectUsersViewProps {
    project: Project;
    isProjectAdmin: boolean;
    isOrgAdmin: boolean;
}

export const ProjectUsersView: React.FC<ProjectUsersViewProps> = ({ project, isProjectAdmin, isOrgAdmin }) => {
    
    // In a real app, this data would come from state/props
    const canManage = isProjectAdmin || isOrgAdmin;

    return (
        <div className="p-8 text-white h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-200">Project User Management</h2>
            <p className="mb-6 text-gray-400">
                Assign project-specific roles to users from your organization. Organization Admins and Project Admins can manage these settings.
            </p>

            {canManage ? (
                <div className="flex-1 bg-gray-900/50 border border-gray-700/50 rounded-lg p-6">
                     <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">Feature Under Construction</h3>
                            <p>This panel will allow you to assign project roles to organization members.</p>
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="flex-1 flex items-center justify-center h-64 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
                    <div className="text-center text-gray-500">
                        <h3 className="text-lg font-semibold">Permission Denied</h3>
                        <p>You must be a Project or Organization Admin to manage users for this project.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
