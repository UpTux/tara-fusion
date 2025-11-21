import React from 'react';
import { useTranslation } from 'react-i18next';
import { projectViews, ProjectViewType } from '../types';
import { BeakerIcon } from './icons/BeakerIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CubeIcon } from './icons/CubeIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';

interface ProjectSidebarProps {
    activeView: ProjectViewType;
    onSelectView: (view: ProjectViewType) => void;
}

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="w-5 h-5 mr-3 text-vscode-text-secondary group-hover:text-vscode-accent transition-colors duration-150">{children}</span>
);

const getIconForView = (view: ProjectViewType) => {
    const lowerView = view.toLowerCase();
    if (lowerView.includes('cockpit')) {
        return <ClockIcon />;
    }
    if (lowerView.includes('mitre') || lowerView.includes('database')) {
        return <DatabaseIcon />;
    }
    if (lowerView.includes('misuse cases')) {
        return <BeakerIcon />;
    }
    if (lowerView.includes('asset')) {
        return <CubeIcon />;
    }
    if (lowerView.includes('attack') || lowerView.includes('threat') || lowerView.includes('risk') || lowerView.includes('damage')) {
        return <ViewfinderCircleIcon />;
    }
    if (lowerView.includes('security') || lowerView.includes('mitigation') || lowerView.includes('treatment') || lowerView.includes('circumvent')) {
        return <ShieldCheckIcon />;
    }
    if (lowerView.includes('graph') || lowerView.includes('summary')) {
        return <ChartBarIcon />;
    }
    if (lowerView.includes('related documents') || lowerView.includes('glossary')) {
        return <DocumentTextIcon />;
    }
    return <DocumentTextIcon />;
};

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ activeView, onSelectView }) => {
    const { t } = useTranslation();
    const toCamelCase = (str: string) => {
        return str
            .split(' ')
            .map((word, index) =>
                index === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join('');
    };
    return (
        <nav className="w-64 bg-vscode-bg-sidebar border-r border-vscode-border p-4 flex flex-col space-y-1 overflow-y-auto">
            {projectViews.map((view, index) => {
                if (view === '---') {
                    return <div key={`spacer-${index}`} className="h-px bg-vscode-border my-2"></div>;
                }
                const translationKey = toCamelCase(view);
                return (
                    <button
                        key={view}
                        onClick={() => onSelectView(view)}
                        className={`
                            w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center group
                            transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-inset focus:ring-vscode-accent
                            ${activeView === view
                                ? 'bg-vscode-accent/20 text-vscode-accent'
                                : 'text-vscode-text-secondary hover:bg-vscode-bg-hover hover:text-vscode-text-primary'
                            }
                        `}
                        aria-current={activeView === view ? 'page' : undefined}
                    >
                        <IconWrapper>{getIconForView(view)}</IconWrapper>
                        {t(translationKey)}
                    </button>
                );
            })}
        </nav>
    );
};