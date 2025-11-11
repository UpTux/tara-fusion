import React, { useCallback, useState } from 'react';
import { Permissions } from '../services/permissionService';
import { exportProjectToJson } from '../services/projectImportExportService';
import { exportToNeedsJson, importFromNeedsJson } from '../services/sphinxNeedsService';
import { exportProjectToSphinxZip } from '../services/sphinxProjectExportService';
import { Organization, Project, ProjectViewType, SphinxNeed } from '../types';
import { AssetsView } from './AssetsView';
import { AssumptionsView } from './AssumptionsView';
import { AttackLeavesView } from './AttackLeavesView';
import { AttackTreeEditor } from './AttackTreeEditor';
import { AttackTreeImageGenerator } from './AttackTreeImageGenerator';
import { CircumventTreesView } from './CircumventTreesView';
import { DamageScenariosView } from './DamageScenariosView';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { MenuIcon } from './icons/MenuIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { ManagementSummaryView } from './ManagementSummaryView';
import { MisuseCasesView } from './MisuseCasesView';
import { MitreAttackDatabaseView } from './MitreAttackDatabaseView';
import { GeminiThreatModal } from './modals/GeminiThreatModal';
import { PlaceholderView } from './PlaceholderView';
import { ProjectCockpit } from './ProjectCockpit';
import { ProjectSidebar } from './ProjectSidebar';
import { ProjectUsersView } from './ProjectUsersView';
import { PropertiesPanel } from './PropertiesPanel';
import { RelatedDocumentsView } from './RelatedDocumentsView';
import { RequirementsCheckView } from './RequirementsCheckView';
import { RiskTreatmentView } from './RiskTreatmentView';
import { ScopeView } from './ScopeView';
import { SecurityClaimsView } from './SecurityClaimsView';
import { SecurityControlsView } from './SecurityControlsView';
import { SecurityGoalsView } from './SecurityGoalsView';
import { TechnicalAttackTreesView } from './TechnicalAttackTreesView';
import { ThreatScenariosView } from './ThreatScenariosView';
import { ThreatsView } from './ThreatsView';
import { ToeConfigurationView } from './ToeConfigurationView';
import { ToeDescriptionView } from './ToeDescriptionView';
import { TraceabilityGraphView } from './TraceabilityGraphView';

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
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const startSphinxProjectExport = () => {
    if (isExporting) return;
    setIsExporting(true);
  };

  const onImagesGeneratedForExport = async (images: Map<string, string>) => {
    try {
      const blob = await exportProjectToSphinxZip(project, images);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s/g, '_')}_sphinx_project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export Sphinx project:', error);
      alert('Failed to export Sphinx project.');
    } finally {
      setIsExporting(false);
    }
  }

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
      case 'Circumvent Trees':
        return <CircumventTreesView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Technical Attack Trees':
        return <TechnicalAttackTreesView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'MITRE ATT&CK Database':
        return <MitreAttackDatabaseView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Security Goals':
        return <SecurityGoalsView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Security Claims':
        return <SecurityClaimsView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'Risk Treatment':
        return <RiskTreatmentView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      case 'TARA Validation':
        return <RequirementsCheckView project={project} />;
      case 'Project Users':
        return <ProjectUsersView project={project} isProjectAdmin={permissions.isProjectAdmin} isOrgAdmin={permissions.isOrgAdmin} />;
      case 'Traceability Graph':
        return <TraceabilityGraphView project={project} />;
      case 'Management Summary':
        return <ManagementSummaryView project={project} onProjectChange={handleProjectDetailsChange} isReadOnly={isReadOnly} />;
      case 'Related Documents':
        return <RelatedDocumentsView project={project} onUpdateProject={onUpdateProject} isReadOnly={isReadOnly} />;
      default:
        return <PlaceholderView title={activeView} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-end p-2 border-b border-vscode-border bg-vscode-bg-sidebar flex-shrink-0">
        {/* Burger Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center px-3 py-1.5 bg-vscode-bg-input text-vscode-text-primary rounded-md text-xs font-medium hover:bg-vscode-bg-hover transition-colors"
            title="Menu"
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              {/* Backdrop to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />

              {/* Menu Items */}
              <div className="absolute right-0 mt-2 w-56 bg-vscode-bg-sidebar border border-vscode-border rounded-md shadow-lg z-20">
                <div className="py-1">
                  {/* Generate with AI */}
                  <button
                    onClick={() => {
                      setIsGeminiModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    disabled={isReadOnly}
                    className="w-full flex items-center px-4 py-2 text-xs text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Generate threats and attack steps using AI"
                  >
                    <SparklesIcon className="w-4 h-4 mr-3" />
                    Generate with AI
                  </button>

                  {/* Export Sphinx Project */}
                  <button
                    onClick={() => {
                      startSphinxProjectExport();
                      setIsMenuOpen(false);
                    }}
                    disabled={isExporting}
                    className="w-full flex items-center px-4 py-2 text-xs text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors disabled:opacity-50 disabled:cursor-wait"
                    title="Export project to a Sphinx documentation ZIP file"
                  >
                    <BookOpenIcon className="w-4 h-4 mr-3" />
                    {isExporting ? 'Exporting...' : 'Export Sphinx Project'}
                  </button>

                  <div className="border-t border-vscode-border my-1"></div>

                  {/* Import Needs */}
                  <label className={`w-full flex items-center px-4 py-2 text-xs text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <UploadIcon className="w-4 h-4 mr-3" />
                    Import Needs
                    <input
                      type="file"
                      className="hidden"
                      accept=".json"
                      onChange={(e) => {
                        handleNeedsImport(e);
                        setIsMenuOpen(false);
                      }}
                      disabled={isReadOnly}
                    />
                  </label>

                  {/* Export Needs */}
                  <button
                    onClick={() => {
                      handleNeedsExport();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-xs text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors"
                    title="Export project data to needs.json"
                  >
                    <DownloadIcon className="w-4 h-4 mr-3" />
                    Export Needs
                  </button>

                  <div className="border-t border-vscode-border my-1"></div>

                  {/* Import Project */}
                  <label className={`w-full flex items-center px-4 py-2 text-xs text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <UploadIcon className="w-4 h-4 mr-3" />
                    Import Project
                    <input
                      type="file"
                      className="hidden"
                      accept=".json"
                      onChange={(e) => {
                        handleProjectImport(e);
                        setIsMenuOpen(false);
                      }}
                      disabled={isReadOnly}
                    />
                  </label>

                  {/* Export Project */}
                  <button
                    onClick={() => {
                      handleProjectExport();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-xs text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors"
                    title="Export entire project to a single JSON file"
                  >
                    <DownloadIcon className="w-4 h-4 mr-3" />
                    Export Project
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
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
      {isExporting && (
        <AttackTreeImageGenerator
          project={project}
          onComplete={onImagesGeneratedForExport}
        />
      )}
    </div>
  );
};