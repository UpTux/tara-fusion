import React, { useState, useCallback } from 'react';
import { Project, SphinxNeed, ProjectViewType, Organization } from '../types';
import { Permissions } from '../services/permissionService';
import { AttackTreeEditor } from './AttackTreeEditor';
import { PropertiesPanel } from './PropertiesPanel';
import { exportToNeedsJson, importFromNeedsJson } from '../services/sphinxNeedsService';
import { exportProjectToJson } from '../services/projectImportExportService';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { GeminiThreatModal } from './modals/GeminiThreatModal';
import { ProjectSidebar } from './ProjectSidebar';
import { PlaceholderView } from './PlaceholderView';
import { ProjectCockpit } from './ProjectCockpit';
import { ToeDescriptionView } from './ToeDescriptionView';
import { ScopeView } from './ScopeView';
import { AssumptionsView } from './AssumptionsView';
import { ToeConfigurationView } from './ToeConfigurationView';
import { SecurityControlsView } from './SecurityControlsView';
import { AssetsView } from './AssetsView';
import { DamageScenariosView } from './DamageScenariosView';
import { ThreatsView } from './ThreatsView';
import { ThreatScenariosView } from './ThreatScenariosView';
import { AttackLeavesView } from './AttackLeavesView';
import { MisuseCasesView } from './MisuseCasesView';
import { SecurityGoalsView } from './SecurityGoalsView';
import { SecurityClaimsView } from './SecurityClaimsView';
import { RiskTreatmentView } from './RiskTreatmentView';
import { ProjectUsersView } from './ProjectUsersView';
import { ManagementSummaryView } from './ManagementSummaryView';

interface ProjectViewProps {
  project: Project;
  organization: Organization;
  onUpdateProject: (project: Project) => void;
  permissions: Permissions;
  onImportProject: (jsonString: string) => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ project, organization, onUpdateProject, permissions, onImportProject }) => {
  const [selectedNeed, setSelectedNeed] = useState<SphinxNeed | null>(null);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<ProjectViewType>('Project Cockpit');
  const isReadOnly = !permissions.canEditProject;

  const addHistoryEntry = (proj: Project, message: string): Project => {
      const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
      return { ...proj, history: newHistory };
  };

  const handleNeedsExport = () => {
    try {
      const jsonString = exportToNeedsJson(project);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s/g, '_')}_needs.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export needs:', error);
      alert('Failed to export project needs data.');
    }
  };

  const handleNeedsImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let updatedProject = importFromNeedsJson(content, project);
        updatedProject = addHistoryEntry(updatedProject, 'Imported needs from file.');
        onUpdateProject(updatedProject);
      } catch (error) {
        console.error('Failed to import needs:', error);
        alert('Failed to import needs.json. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleProjectExport = () => {
    try {
      const jsonString = exportProjectToJson(project);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s/g, '_')}_project.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export project:', error);
      alert('Failed to export project data.');
    }
  };

  const handleProjectImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        onImportProject(content);
      } catch (error) {
        console.error('Failed to import project:', error);
        alert('Failed to import project file.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };
  
  const handleThreatsGenerated = (newNeeds: SphinxNeed[]) => {
    if (isReadOnly) return;
    let updatedProject = {
      ...project,
      needs: [...project.needs, ...newNeeds]
    };
    updatedProject = addHistoryEntry(updatedProject, `Generated ${newNeeds.length} new items with AI.`);
    onUpdateProject(updatedProject);
  };

  const handleNeedChange = useCallback((updatedNeed: SphinxNeed) => {
    if (isReadOnly) return;
    if (selectedNeed?.id === updatedNeed.id) {
        setSelectedNeed(updatedNeed);
    }

    const originalNeed = project.needs.find(n => n.id === updatedNeed.id);
    const changes: string[] = [];
    if (originalNeed) {
        (Object.keys(updatedNeed) as Array<keyof SphinxNeed>).forEach(key => {
            if (JSON.stringify(originalNeed[key]) !== JSON.stringify(updatedNeed[key])) {
                changes.push(String(key));
            }
        });
    }
    
    const updatedProject = {
        ...project,
        needs: project.needs.map(n => (n.id === updatedNeed.id ? updatedNeed : n)),
    };
    
    if (changes.length > 0) {
        const historyMessage = `Updated need ${updatedNeed.id} (${changes.join(', ') || 'no changes'}).`;
        onUpdateProject(addHistoryEntry(updatedProject, historyMessage));
    } else {
         onUpdateProject(updatedProject);
    }

  }, [project, onUpdateProject, selectedNeed, isReadOnly]);

  const handleNeedsUpdate = useCallback((updatedNeeds: SphinxNeed[], historyMessage: string) => {
    if (isReadOnly) return;
    const updatedProject = { ...project, needs: updatedNeeds };
    onUpdateProject(addHistoryEntry(updatedProject, historyMessage));
  }, [project, onUpdateProject, isReadOnly]);

  const handleProjectDetailsChange = useCallback((field: keyof Project, value: any) => {
    if (isReadOnly) return;
    const oldValue = project[field] || '""';
    // Avoid logging history for identical values
    if (JSON.stringify(value) === JSON.stringify(oldValue)) return;
    const historyMessage = `Updated project ${String(field)}.`;
    const updatedProject = { ...project, [field]: value };
    onUpdateProject(addHistoryEntry(updatedProject, historyMessage));
  }, [project, onUpdateProject, isReadOnly]);
  
  const renderActiveView = () => {
    switch (activeView) {
      case 'Project Cockpit':
        return <ProjectCockpit project={project} onProjectChange={handleProjectDetailsChange} isReadOnly={isReadOnly} />;
      case 'TOE Description':
        return <ToeDescriptionView project={project} onProjectChange={handleProjectDetailsChange} isReadOnly={isReadOnly} />;
      case 'Scope':
        return <ScopeView project={project} onProjectChange={handleProjectDetailsChange} isReadOnly={isReadOnly} />;
      case 'Assumptions':
        return <AssumptionsView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'TOE Configuration':
        return <ToeConfigurationView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Security Controls':
        return <SecurityControlsView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Misuse Cases':
        return <MisuseCasesView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Assets':
        return <AssetsView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Damage Scenarios':
        return <DamageScenariosView project={project} organization={organization} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Threats':
        return <ThreatsView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Threat Scenarios':
        return <ThreatScenariosView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Attack Trees':
        return (
          <div className="flex-1 h-full flex">
            <div className="flex-1 h-full relative">
              <AttackTreeEditor
                project={project}
                onUpdateNeeds={handleNeedsUpdate}
                onUpdateNeed={handleNeedChange}
                onSelectNeed={setSelectedNeed}
                isReadOnly={isReadOnly}
              />
            </div>
            {selectedNeed && (
              <PropertiesPanel
                key={selectedNeed.id}
                need={selectedNeed}
                project={project}
                onChange={handleNeedChange}
                isReadOnly={isReadOnly}
              />
            )}
          </div>
        );
      case 'Attack Leaves':
        return <AttackLeavesView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Security Goals':
        return <SecurityGoalsView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Security Claims':
        return <SecurityClaimsView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Risk Treatment':
        return <RiskTreatmentView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Project Users':
        return <ProjectUsersView project={project} isProjectAdmin={permissions.isProjectAdmin} isOrgAdmin={permissions.isOrgAdmin} />;
      case 'Management Summary':
        return <ManagementSummaryView project={project} onProjectChange={handleProjectDetailsChange} isReadOnly={isReadOnly} />;
      default:
        return <PlaceholderView title={activeView} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center justify-end p-2 border-b border-gray-700/50 bg-gray-900/20 space-x-2 flex-shrink-0">
            <button
              onClick={() => setIsGeminiModalOpen(true)}
              disabled={isReadOnly}
              className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Generate threats and attack steps using AI"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate with AI
            </button>

            <label className={`flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md text-xs font-medium hover:bg-gray-500 transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <UploadIcon className="w-4 h-4 mr-2" />
              Import Needs
              <input
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleNeedsImport}
                disabled={isReadOnly}
              />
            </label>

            <button
              onClick={handleNeedsExport}
              className="flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md text-xs font-medium hover:bg-gray-500 transition-colors"
              title="Export project data to needs.json"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export Needs
            </button>

            <div className="h-5 w-px bg-gray-600 mx-1"></div>

            <label className={`flex items-center px-3 py-1.5 bg-teal-600 text-white rounded-md text-xs font-medium hover:bg-teal-500 transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <UploadIcon className="w-4 h-4 mr-2" />
              Import Project
              <input
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleProjectImport}
                disabled={isReadOnly}
              />
            </label>

            <button
              onClick={handleProjectExport}
              className="flex items-center px-3 py-1.5 bg-teal-600 text-white rounded-md text-xs font-medium hover:bg-teal-500 transition-colors"
              title="Export entire project to a single JSON file"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export Project
            </button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <ProjectSidebar activeView={activeView} onSelectView={setActiveView} />
          <main className="flex-1 flex flex-col overflow-y-auto">
            {renderActiveView()}
          </main>
        </div>
        
       {isGeminiModalOpen && (
        <GeminiThreatModal
          onClose={() => setIsGeminiModalOpen(false)}
          onGenerated={handleThreatsGenerated}
        />
      )}
    </div>
  );
};