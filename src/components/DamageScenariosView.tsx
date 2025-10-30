

import React, { useState, useEffect } from 'react';
import { Project, Organization, DamageScenario, Impact } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CogIcon } from './icons/CogIcon';

interface DamageScenariosViewProps {
  project: Project;
  organization: Organization;
  onUpdateProject: (project: Project) => void;
  isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-400 mb-1">{children}</label>
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
     <select {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
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
    const updatedProject = addHistoryEntry({...project, impactCategorySettings: newSettings}, 'Updated project-level impact categories.');
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
    <div className="flex h-full text-white">
      {/* List */}
      <div className="w-2/5 border-r border-gray-700/50 flex flex-col">
        <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Damage Scenarios</h2>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsCategoryEditorOpen(true)} title="Edit Impact Categories" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}>
                <CogIcon className="w-5 h-5" />
            </button>
            <button onClick={handleAdd} title="Add new damage scenario" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}>
                <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider">ID</th>
                <th className="p-3 font-semibold tracking-wider">Name</th>
                <th className="p-3 font-semibold tracking-wider">Impact</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(ds => (
                <tr
                  key={ds.id}
                  onClick={() => setSelectedId(ds.id)}
                  className={`border-t border-gray-700/50 cursor-pointer transition-colors ${selectedId === ds.id ? 'bg-indigo-600/20' : 'hover:bg-gray-800/50'}`}
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
              <h2 className="text-2xl font-bold text-gray-200">{editorState.id}: {editorState.name}</h2>
               <button onClick={handleDelete} className="flex items-center px-3 py-2 bg-red-800/50 text-red-300 rounded-md text-sm font-medium hover:bg-red-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}>
                    <TrashIcon className="w-4 h-4 mr-2"/>
                    Delete
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="dsId">ID</Label>
                    <Input id="dsId" type="text" value={editorState.id} onBlur={e => handleUpdate('id', e.target.value)} onChange={e => setEditorState({...editorState, id: e.target.value})} disabled={isReadOnly} />
                </div>
                <div>
                    <Label htmlFor="dsName">Name</Label>
                    <Input id="dsName" type="text" value={editorState.name} onBlur={e => handleUpdate('name', e.target.value)} onChange={e => setEditorState({...editorState, name: e.target.value})} disabled={isReadOnly} />
                </div>
                 <div className="col-span-2">
                    <Label htmlFor="dsDesc">Description</Label>
                    <Textarea id="dsDesc" rows={3} value={editorState.description} onBlur={e => handleUpdate('description', e.target.value)} onChange={e => setEditorState({...editorState, description: e.target.value})} disabled={isReadOnly} />
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
              <Textarea id="dsReasoning" rows={6} value={editorState.reasoning} onBlur={e => handleUpdate('reasoning', e.target.value)} onChange={e => setEditorState({...editorState, reasoning: e.target.value})} disabled={isReadOnly} />
            </div>
            <div>
              <Label htmlFor="dsComment">Comment (RST)</Label>
              <Textarea id="dsComment" rows={6} value={editorState.comment} onBlur={e => handleUpdate('comment', e.target.value)} onChange={e => setEditorState({...editorState, comment: e.target.value})} disabled={isReadOnly} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
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
    
    const [categories, setCategories] = useState( (projectSettings?.categories || orgCategories).join('\n') );
    const [justification, setJustification] = useState( projectSettings?.justification || '' );
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
            <h2 className="text-2xl font-bold text-gray-200 mb-4">Edit Impact Categories</h2>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 mb-6">
                <h3 className="font-semibold mb-2 text-gray-300">Organizational Default Categories</h3>
                <ul className="text-sm text-gray-400 list-disc list-inside">
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
                <p className="text-xs text-gray-500 mb-2">Required if categories differ from the organizational default.</p>
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
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">
                    Cancel
                </button>
                <button onClick={handleSaveClick} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={isReadOnly}>
                    Save Changes
                </button>
            </div>
        </div>
    );
};