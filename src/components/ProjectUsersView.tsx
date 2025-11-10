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
        <div className="p-8 text-vscode-text-primary h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-vscode-text-primary">Project User Management</h2>
            <p className="mb-6 text-vscode-text-secondary">
                Assign project-specific roles to users from your organization. Organization Admins and Project Admins can manage these settings.
            </p>

            {canManage ? (
                <div className="flex-1 bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
                    <div className="flex items-center justify-center h-full text-vscode-text-secondary">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-vscode-text-primary">Feature Under Construction</h3>
                            <p>This panel will allow you to assign project roles to organization members.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center h-64 bg-vscode-bg-sidebar rounded-lg border-2 border-dashed border-vscode-border">
                    <div className="text-center text-vscode-text-secondary">
                        <h3 className="text-2xl font-bold text-vscode-text-primary">Permission Denied</h3>
                        <p>You must be a Project or Organization Admin to manage users for this project.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
