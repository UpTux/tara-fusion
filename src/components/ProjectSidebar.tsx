import React from 'react';
import { projectViews, ProjectViewType } from '../types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ViewfinderCircleIcon } from './icons/ViewfinderCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CubeIcon } from './icons/CubeIcon';
import { BeakerIcon } from './icons/BeakerIcon';

interface ProjectSidebarProps {
  activeView: ProjectViewType;
  onSelectView: (view: ProjectViewType) => void;
}

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="w-5 h-5 mr-3 text-gray-400 group-hover:text-indigo-400 transition-colors duration-150">{children}</span>
);

const getIconForView = (view: ProjectViewType) => {
    const lowerView = view.toLowerCase();
    if (lowerView.includes('cockpit')) {
        return <ClockIcon />;
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
    return <DocumentTextIcon />;
};

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ activeView, onSelectView }) => {
    return (
        <nav className="w-64 bg-gray-900/50 border-r border-gray-700/50 p-4 flex flex-col space-y-1 overflow-y-auto">
            {projectViews.map((view, index) => {
                if (view === '---') {
                    return <div key={`spacer-${index}`} className="h-px bg-gray-700/50 my-2"></div>;
                }
                return (
                    <button
                        key={view}
                        onClick={() => onSelectView(view)}
                        className={`
                            w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center group
                            transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500
                            ${
                                activeView === view
                                    ? 'bg-indigo-600/20 text-indigo-300'
                                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                            }
                        `}
                        aria-current={activeView === view ? 'page' : undefined}
                    >
                        <IconWrapper>{getIconForView(view)}</IconWrapper>
                        {view}
                    </button>
                );
            })}
        </nav>
    );
};