

import React, { useEffect, useState } from 'react';
import { Project, SecurityControl } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SecurityControlsViewProps {
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

export const SecurityControlsView: React.FC<SecurityControlsViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [securityControls, setSecurityControls] = useState<SecurityControl[]>(project.securityControls || []);
  const [selectedId, setSelectedId] = useState<string | null>(securityControls[0]?.id || null);
  const [editorState, setEditorState] = useState<SecurityControl | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const currentControls = project.securityControls || [];
    setSecurityControls(currentControls);
    if (!selectedId && currentControls.length > 0) {
      setSelectedId(currentControls[0].id)
    }
  }, [project.securityControls, selectedId]);

  useEffect(() => {
    const selected = securityControls.find(sc => sc.id === selectedId);
    setEditorState(selected ? { ...selected } : null);
  }, [selectedId, securityControls]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleAdd = () => {
    if (isReadOnly) return;
    const existingIds = new Set(securityControls.map(a => a.id));
    let i = 1;
    let newId = `SC_${String(i).padStart(3, '0')}`;
    while (existingIds.has(newId)) {
      i++;
      newId = `SC_${String(i).padStart(3, '0')}`;
    }

    const newControl: SecurityControl = {
      id: newId,
      activeRRA: true,
      name: 'New Security Control',
      description: '',
      securityGoalIds: [],
      comment: ''
    };

    const updatedControls = [...securityControls, newControl];
    const updatedProject = addHistoryEntry({ ...project, securityControls: updatedControls }, `Created Security Control ${newId}.`);
    onUpdateProject(updatedProject);
    setSelectedId(newId);
  };

  const handleUpdate = (field: keyof SecurityControl, value: any) => {
    if (isReadOnly || !editorState) return;

    const originalControl = securityControls.find(sc => sc.id === editorState.id);
    if (!originalControl || JSON.stringify(originalControl[field]) === JSON.stringify(value)) {
      setEditorState(prev => prev ? { ...prev, [field]: value } : null);
      return;
    }

    const updatedControls = securityControls.map(sc => sc.id === editorState.id ? { ...editorState, [field]: value } : sc);
    const updatedProject = addHistoryEntry({ ...project, securityControls: updatedControls }, `Updated ${field} for Security Control ${editorState.id}.`);
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
    if (window.confirm(`Are you sure you want to delete Security Control ${selectedId}?`)) {
      const updatedControls = securityControls.filter(sc => sc.id !== selectedId);
      const updatedProject = addHistoryEntry({ ...project, securityControls: updatedControls }, `Deleted Security Control ${selectedId}.`);
      onUpdateProject(updatedProject);
      setSelectedId(updatedControls[0]?.id || null);
    }
  };

  return (
    <div className="flex h-full text-white">
      {/* Security Controls List */}
      <div className="w-1/3 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-vscode-text-primary">Security Controls</h2>
          <button onClick={handleAdd} title="Add new security control" className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}>
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary" title="Active for TARA">Active</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary" title="Active for Residual-Risk-Analysis">RRA</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">ID</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Name</th>
              </tr>
            </thead>
            <tbody>
              {securityControls.map(sc => (
                <tr
                  key={sc.id}
                  onClick={() => setSelectedId(sc.id)}
                  className={`border-t border-vscode-border cursor-pointer transition-colors ${selectedId === sc.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}
                >
                  <td className="p-3 text-center">
                    <span className={`w-3 h-3 rounded-full inline-block ${sc.active ? 'bg-green-500' : 'bg-vscode-text-secondary'}`} title={sc.active ? 'Active' : 'Inactive'}></span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`w-3 h-3 rounded-full inline-block ${sc.activeRRA ? 'bg-blue-500' : 'bg-vscode-text-secondary'}`} title={sc.activeRRA ? 'Active for RRA' : 'Inactive for RRA'}></span>
                  </td>
                  <td className="p-3 font-mono text-indigo-400">{sc.id}</td>
                  <td className="p-3">{sc.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Control Editor */}
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
                <Label htmlFor="scId">ID</Label>
                <Input id="scId" type="text" value={editorState.id} onBlur={e => handleUpdate('id', e.target.value)} onChange={e => setEditorState({ ...editorState, id: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="scName">Name</Label>
                <Input id="scName" type="text" value={editorState.name} onBlur={e => handleUpdate('name', e.target.value)} onChange={e => setEditorState({ ...editorState, name: e.target.value })} disabled={isReadOnly} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="scDesc">Description</Label>
                <Textarea id="scDesc" rows={3} value={editorState.description} onBlur={e => handleUpdate('description', e.target.value)} onChange={e => setEditorState({ ...editorState, description: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="scGoalIds">Security Goal IDs (comma-separated)</Label>
                <Input id="scGoalIds" type="text" value={editorState.securityGoalIds.join(', ')} onBlur={e => handleUpdate('securityGoalIds', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} onChange={e => setEditorState({ ...editorState, securityGoalIds: e.target.value.split(',').map(s => s.trim()) })} disabled={isReadOnly} />
              </div>
              <div className="flex items-center space-x-6 pt-5">
                <div className="flex items-center">
                  <input id="scActiveRRA" type="checkbox" checked={editorState.activeRRA} onChange={e => handleUpdate('activeRRA', e.target.checked)} className="h-4 w-4 rounded border-vscode-border bg-vscode-bg-input text-vscode-accent focus:ring-vscode-accent disabled:cursor-not-allowed" disabled={isReadOnly} />
                  <label htmlFor="scActiveRRA" className="ml-3 block text-sm font-medium text-vscode-text-primary">Active (RRA)</label>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="scComment">Comment (RST)</Label>
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
              <Textarea id="scComment" rows={10} value={editorState.comment} onChange={e => setEditorState({ ...editorState, comment: e.target.value })} disabled={isReadOnly} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary">
            <div className="text-center">
              <h3 className="text-lg">No Security Control Selected</h3>
              <p>Select a control from the list or create a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
