

import React, { useEffect, useState } from 'react';
import { DamageScenario, Impact, Organization, Project } from '../types';
import { CogIcon } from './icons/CogIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface DamageScenariosViewProps {
  project: Project;
  organization: Organization;
  onUpdateProject: (project: Project) => void;
  isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-vscode-text-secondary mb-1">{children}</label>
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);

export const DamageScenariosView: React.FC<DamageScenariosViewProps> = ({ project, organization, onUpdateProject, isReadOnly }) => {
  const [scenarios, setScenarios] = useState<DamageScenario[]>(project.damageScenarios || []);
  const [selectedId, setSelectedId] = useState<string | null>(scenarios[0]?.id || null);
  const [editorState, setEditorState] = useState<DamageScenario | null>(null);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);

  const orgCategories = organization.impactCategorySettings?.categories || [];
  const projectCategories = project.impactCategorySettings?.categories;
  const activeCategories = projectCategories || orgCategories;

  useEffect(() => {
    const currentScenarios = project.damageScenarios || [];
    setScenarios(currentScenarios);
    if (!selectedId && currentScenarios.length > 0) {
      setSelectedId(currentScenarios[0].id)
    }
  }, [project.damageScenarios, selectedId]);

  useEffect(() => {
    const selected = scenarios.find(ds => ds.id === selectedId);
    setEditorState(selected ? { ...selected } : null);
  }, [selectedId, scenarios]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleAdd = () => {
    if (isReadOnly) return;
    const existingIds = new Set(scenarios.map(a => a.id));
    let i = 1;
    let newId = `DS_${String(i).padStart(3, '0')}`;
    while (existingIds.has(newId)) { i++; newId = `DS_${String(i).padStart(3, '0')}`; }

    const newScenario: DamageScenario = {
      id: newId,
      name: 'New Damage Scenario',
      description: '',
      impactCategory: activeCategories[0] || '',
      impact: Impact.NEGLIGIBLE,
      reasoning: '',
      comment: ''
    };

    const updatedScenarios = [...scenarios, newScenario];
    const updatedProject = addHistoryEntry({ ...project, damageScenarios: updatedScenarios }, `Created Damage Scenario ${newId}.`);
    onUpdateProject(updatedProject);
    setSelectedId(newId);
  };

  const handleUpdate = (field: keyof DamageScenario, value: any) => {
    if (isReadOnly || !editorState) return;

    const originalScenario = scenarios.find(ds => ds.id === editorState.id);
    if (!originalScenario || JSON.stringify(originalScenario[field]) === JSON.stringify(value)) {
      setEditorState(prev => prev ? { ...prev, [field]: value } : null);
      return;
    }

    const updatedScenarios = scenarios.map(ds => ds.id === editorState.id ? { ...editorState, [field]: value } : ds);
    const updatedProject = addHistoryEntry({ ...project, damageScenarios: updatedScenarios }, `Updated ${field} for Damage Scenario ${editorState.id}.`);
    onUpdateProject(updatedProject);
  };

  const handleDelete = () => {
    if (isReadOnly || !selectedId) return;
    if (window.confirm(`Are you sure you want to delete Damage Scenario ${selectedId}?`)) {
      const updatedScenarios = scenarios.filter(ds => ds.id !== selectedId);
      const updatedProject = addHistoryEntry({ ...project, damageScenarios: updatedScenarios }, `Deleted Damage Scenario ${selectedId}.`);
      onUpdateProject(updatedProject);
      setSelectedId(updatedScenarios[0]?.id || null);
    }
  };

  const handleSaveCategories = (newCategories: string[], newJustification: string) => {
    if (isReadOnly) return;
    const newSettings = { categories: newCategories, justification: newJustification };
    const updatedProject = addHistoryEntry({ ...project, impactCategorySettings: newSettings }, 'Updated project-level impact categories.');
    onUpdateProject(updatedProject);
    setIsCategoryEditorOpen(false);
  };

  const handleResetCategories = () => {
    if (isReadOnly) return;
    const { impactCategorySettings, ...rest } = project;
    const updatedProject = addHistoryEntry(rest, 'Reset impact categories to organizational default.');
    onUpdateProject(updatedProject);
    setIsCategoryEditorOpen(false);
  };

  return (
    <div className="flex h-full text-vscode-text-primary">
      {/* List */}
      <div className="w-2/5 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-vscode-text-primary">Damage Scenarios</h2>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsCategoryEditorOpen(true)} title="Edit Impact Categories" className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}>
              <CogIcon className="w-5 h-5" />
            </button>
            <button onClick={handleAdd} title="Add new damage scenario" className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}>
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">ID</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Name</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Impact</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(ds => (
                <tr
                  key={ds.id}
                  onClick={() => setSelectedId(ds.id)}
                  className={`border-t border-vscode-border cursor-pointer transition-colors ${selectedId === ds.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}
                >
                  <td className="p-3 font-mono text-indigo-400">{ds.id}</td>
                  <td className="p-3">{ds.name}</td>
                  <td className="p-3 font-semibold text-yellow-300">{ds.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor */}
      <div className="w-3/5 flex-1 overflow-y-auto p-8">
        {isCategoryEditorOpen ? (
          <CategoryEditor
            orgCategories={orgCategories}
            projectSettings={project.impactCategorySettings}
            onSave={handleSaveCategories}
            onReset={handleResetCategories}
            onClose={() => setIsCategoryEditorOpen(false)}
            isReadOnly={isReadOnly}
          />
        ) : editorState ? (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-vscode-text-primary">{editorState.id}: {editorState.name}</h2>
              <button onClick={handleDelete} className="flex items-center px-3 py-2 bg-red-800/50 text-red-300 rounded-md text-sm font-medium hover:bg-red-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}>
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="dsId">ID</Label>
                <Input id="dsId" type="text" value={editorState.id} onBlur={e => handleUpdate('id', e.target.value)} onChange={e => setEditorState({ ...editorState, id: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="dsName">Name</Label>
                <Input id="dsName" type="text" value={editorState.name} onBlur={e => handleUpdate('name', e.target.value)} onChange={e => setEditorState({ ...editorState, name: e.target.value })} disabled={isReadOnly} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="dsDesc">Description</Label>
                <Textarea id="dsDesc" rows={3} value={editorState.description} onBlur={e => handleUpdate('description', e.target.value)} onChange={e => setEditorState({ ...editorState, description: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="dsImpactCat">Impact Category</Label>
                <Select id="dsImpactCat" value={editorState.impactCategory} onChange={e => handleUpdate('impactCategory', e.target.value)} disabled={isReadOnly}>
                  {activeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="dsImpact">Impact</Label>
                <Select id="dsImpact" value={editorState.impact} onChange={e => handleUpdate('impact', e.target.value as Impact)} disabled={isReadOnly}>
                  {Object.values(Impact).map(val => <option key={val} value={val}>{val}</option>)}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dsReasoning">Reasoning (RST)</Label>
              <Textarea id="dsReasoning" rows={6} value={editorState.reasoning} onBlur={e => handleUpdate('reasoning', e.target.value)} onChange={e => setEditorState({ ...editorState, reasoning: e.target.value })} disabled={isReadOnly} />
            </div>
            <div>
              <Label htmlFor="dsComment">Comment (RST)</Label>
              <Textarea id="dsComment" rows={6} value={editorState.comment} onBlur={e => handleUpdate('comment', e.target.value)} onChange={e => setEditorState({ ...editorState, comment: e.target.value })} disabled={isReadOnly} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary">
            <div className="text-center">
              <h3 className="text-lg">No Damage Scenario Selected</h3>
              <p>Select a scenario from the list or create a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryEditor: React.FC<{
  orgCategories: string[];
  projectSettings?: { categories: string[], justification?: string };
  onSave: (categories: string[], justification: string) => void;
  onReset: () => void;
  onClose: () => void;
  isReadOnly: boolean;
}> = ({ orgCategories, projectSettings, onSave, onReset, onClose, isReadOnly }) => {

  const [categories, setCategories] = useState((projectSettings?.categories || orgCategories).join('\n'));
  const [justification, setJustification] = useState(projectSettings?.justification || '');
  const isOverridden = !!projectSettings;

  const handleSaveClick = () => {
    const categoryList = categories.split('\n').map(c => c.trim()).filter(Boolean);
    if (!isOverridden && JSON.stringify(categoryList) === JSON.stringify(orgCategories)) {
      onClose(); // No change from default, just close
      return;
    }
    if (categoryList.length === 0) {
      alert('You must provide at least one impact category.');
      return;
    }
    if (justification.trim() === '') {
      alert('You must provide a justification for overriding the organizational categories.');
      return;
    }
    onSave(categoryList, justification);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-vscode-text-primary mb-4">Edit Impact Categories</h2>
      <div className="bg-vscode-bg-sidebar p-4 rounded-lg border border-vscode-border mb-6">
        <h3 className="font-semibold mb-2 text-vscode-text-primary">Organizational Default Categories</h3>
        <ul className="text-sm text-vscode-text-secondary list-disc list-inside">
          {orgCategories.map(c => <li key={c}>{c}</li>)}
        </ul>
      </div>

      <div>
        <Label htmlFor="customCategories">Project-Level Categories (one per line)</Label>
        <Textarea
          id="customCategories"
          rows={8}
          value={categories}
          onChange={e => setCategories(e.target.value)}
          disabled={isReadOnly}
        />
      </div>

      <div className="mt-6">
        <Label htmlFor="justification">Justification for Override (RST)</Label>
        <p className="text-xs text-vscode-text-secondary mb-2">Required if categories differ from the organizational default.</p>
        <Textarea
          id="justification"
          rows={5}
          value={justification}
          onChange={e => setJustification(e.target.value)}
          disabled={isReadOnly}
        />
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        {isOverridden && (
          <button onClick={onReset} className="px-4 py-2 text-sm font-medium text-yellow-300 bg-yellow-800/40 rounded-md hover:bg-yellow-800/70 disabled:opacity-50" disabled={isReadOnly}>
            Reset to Default
          </button>
        )}
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-vscode-text-primary bg-vscode-bg-input rounded-md hover:bg-vscode-bg-hover">
          Cancel
        </button>
        <button onClick={handleSaveClick} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={isReadOnly}>
          Save Changes
        </button>
      </div>
    </div>
  );
};