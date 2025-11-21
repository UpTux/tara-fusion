import React from 'react';
import { useTranslation } from 'react-i18next';
import { Project } from '../types';

interface ProjectUsersViewProps {
    project: Project;
    isProjectAdmin: boolean;
    isOrgAdmin: boolean;
}

export const ProjectUsersView: React.FC<ProjectUsersViewProps> = ({ project, isProjectAdmin, isOrgAdmin }) => {
    const { t } = useTranslation();

    // In a real app, this data would come from state/props
    const canManage = isProjectAdmin || isOrgAdmin;

    return (
        <div className="p-8 text-vscode-text-primary h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-vscode-text-primary">{t('projectUsersTitle')}</h2>
            <p className="mb-6 text-vscode-text-secondary">
                {t('projectUsersInfo')}
            </p>

            {canManage ? (
                <div className="flex-1 bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
                    <div className="flex items-center justify-center h-full text-vscode-text-secondary">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-vscode-text-primary">{t('featureUnderConstruction')}</h3>
                            <p>{t('noProjectUsersInfo')}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center h-64 bg-vscode-bg-sidebar rounded-lg border-2 border-dashed border-vscode-border">
                    <div className="text-center text-vscode-text-secondary">
                        <h3 className="text-2xl font-bold text-vscode-text-primary">{t('accessDenied')}</h3>
                        <p>{t('mustBeOrgAdmin')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
