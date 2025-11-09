

import React, { useEffect, useState } from 'react';
import { Project, ToeConfiguration } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ToeConfigurationViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-vscode-text-secondary mb-1">{children}</label>
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className="block w-full px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md shadow-sm placeholder-vscode-text-secondary focus:outline-none focus:ring-vscode-accent focus:border-vscode-accent sm:text-sm text-vscode-text-primary disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed" />
);

export const ToeConfigurationView: React.FC<ToeConfigurationViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [configurations, setConfigurations] = useState<ToeConfiguration[]>(project.toeConfigurations || []);
  const [selectedId, setSelectedId] = useState<string | null>(configurations[0]?.id || null);
  const [editorState, setEditorState] = useState<ToeConfiguration | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const currentConfigs = project.toeConfigurations || [];
    setConfigurations(currentConfigs);
    if (!selectedId && currentConfigs.length > 0) {
      setSelectedId(currentConfigs[0].id)
    }
  }, [project.toeConfigurations, selectedId]);

  useEffect(() => {
    const selected = configurations.find(a => a.id === selectedId);
    setEditorState(selected ? { ...selected } : null);
  }, [selectedId, configurations]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleAdd = () => {
    if (isReadOnly) return;
    const existingIds = new Set(configurations.map(a => a.id));
    let i = 1;
    let newId = `TOE_CONF_${String(i).padStart(3, '0')}`;
    while (existingIds.has(newId)) {
      i++;
      newId = `TOE_CONF_${String(i).padStart(3, '0')}`;
    }

    const newConfig: ToeConfiguration = {
      id: newId,
      active: true,
      name: 'New Configuration',
      description: '',
      comment: ''
    };

    const updatedConfigs = [...configurations, newConfig];
    const updatedProject = addHistoryEntry({ ...project, toeConfigurations: updatedConfigs }, `Created TOE Configuration ${newId}.`);
    onUpdateProject(updatedProject);
    setSelectedId(newId);
  };

  const handleUpdate = (field: keyof ToeConfiguration, value: any) => {
    if (isReadOnly || !editorState) return;

    const originalConfig = configurations.find(a => a.id === editorState.id);
    if (!originalConfig || JSON.stringify(originalConfig[field]) === JSON.stringify(value)) {
      setEditorState(prev => prev ? { ...prev, [field]: value } : null);
      return;
    }

    if (field === 'active') {
      console.warn(`Toggling active status for ${editorState.id}. Cascading logic to linked artifacts (assumptions, threats, etc.) is not yet implemented.`);
    }

    const updatedConfigs = configurations.map(a => a.id === editorState.id ? { ...editorState, [field]: value } : a);
    const updatedProject = addHistoryEntry({ ...project, toeConfigurations: updatedConfigs }, `Updated ${field} for TOE Configuration ${editorState.id}.`);
    onUpdateProject(updatedProject);
  };

  const handleCommentSave = () => {
    if (isReadOnly || !editorState) return;
    setSaveStatus('saving');
    handleUpdate('comment', editorState.comment);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleDelete = () => {
    if (isReadOnly || !selectedId) return;
    if (window.confirm(`Are you sure you want to delete TOE Configuration ${selectedId}?`)) {
      const updatedConfigs = configurations.filter(a => a.id !== selectedId);
      const updatedProject = addHistoryEntry({ ...project, toeConfigurations: updatedConfigs }, `Deleted TOE Configuration ${selectedId}.`);
      onUpdateProject(updatedProject);
      setSelectedId(updatedConfigs[0]?.id || null);
    }
  };

  return (
    <div className="flex h-full text-white">
      {/* Configurations List */}
      <div className="w-1/3 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-vscode-text-primary">TOE Configurations</h2>
          <button onClick={handleAdd} title="Add new TOE configuration" className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}>
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider">Status</th>
                <th className="p-3 font-semibold tracking-wider">ID</th>
                <th className="p-3 font-semibold tracking-wider">Name</th>
              </tr>
            </thead>
            <tbody>
              {configurations.map(conf => (
                <tr
                  key={conf.id}
                  onClick={() => setSelectedId(conf.id)}
                  className={`border-t border-vscode-border cursor-pointer transition-colors ${selectedId === conf.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}
                >
                  <td className="p-3">
                    <span className={`w-3 h-3 rounded-full inline-block ${conf.active ? 'bg-green-500' : 'bg-vscode-text-secondary'}`} title={conf.active ? 'Active' : 'Inactive'}></span>
                  </td>
                  <td className="p-3 font-mono text-indigo-400">{conf.id}</td>
                  <td className="p-3">{conf.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Editor */}
      <div className="w-2/3 flex-1 overflow-y-auto p-8">
        {editorState ? (
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
                <Label htmlFor="confId">ID</Label>
                <Input id="confId" type="text" value={editorState.id} onBlur={e => handleUpdate('id', e.target.value)} onChange={e => setEditorState({ ...editorState, id: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="confName">Name</Label>
                <Input id="confName" type="text" value={editorState.name} onBlur={e => handleUpdate('name', e.target.value)} onChange={e => setEditorState({ ...editorState, name: e.target.value })} disabled={isReadOnly} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="confDesc">Description</Label>
                <Textarea id="confDesc" rows={4} value={editorState.description} onBlur={e => handleUpdate('description', e.target.value)} onChange={e => setEditorState({ ...editorState, description: e.target.value })} disabled={isReadOnly} />
              </div>
              <div className="flex items-center pt-2">
                <input id="confActive" type="checkbox" checked={editorState.active} onChange={e => handleUpdate('active', e.target.checked)} className="h-4 w-4 rounded border-vscode-border bg-vscode-bg-input text-vscode-accent focus:ring-vscode-accent disabled:cursor-not-allowed" disabled={isReadOnly} />
                <label htmlFor="confActive" className="ml-3 block text-sm font-medium text-vscode-text-primary">Active</label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="confComment">Comment (RST)</Label>
                <button
                  onClick={handleCommentSave}
                  disabled={saveStatus !== 'idle' || isReadOnly}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50
                        ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50'}
                    `}
                >
                  {saveStatus === 'idle' && 'Save Comment'}
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'saved' && 'Saved!'}
                </button>
              </div>
              <Textarea id="confComment" rows={10} value={editorState.comment} onChange={e => setEditorState({ ...editorState, comment: e.target.value })} disabled={isReadOnly} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary">
            <div className="text-center">
              <h3 className="text-lg">No Configuration Selected</h3>
              <p>Select a configuration from the list or create a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
