

import React, { useCallback, useEffect, useState } from 'react';
import { Assumption, Project } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface AssumptionsViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-400 mb-1">{children}</label>
);
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);

export const AssumptionsView: React.FC<AssumptionsViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [assumptions, setAssumptions] = useState<Assumption[]>(project.assumptions || []);
  const [selectedId, setSelectedId] = useState<string | null>(assumptions[0]?.id || null);
  const [editorState, setEditorState] = useState<Assumption | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setAssumptions(project.assumptions || []);
    if (!selectedId && (project.assumptions || []).length > 0) {
      setSelectedId((project.assumptions || [])[0]?.id)
    }
  }, [project.assumptions, selectedId]);

  useEffect(() => {
    const selected = assumptions.find(a => a.id === selectedId);
    setEditorState(selected ? { ...selected } : null);
  }, [selectedId, assumptions]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleAdd = useCallback(() => {
    if (isReadOnly) return;
    const existingIds = new Set(assumptions.map(a => a.id));
    let i = 1;
    let newId = `ASS_${String(i).padStart(3, '0')}`;
    while (existingIds.has(newId)) {
      i++;
      newId = `ASS_${String(i).padStart(3, '0')}`;
    }

    const newAssumption: Assumption = {
      id: newId,
      active: true,
      name: 'New Assumption',
      toeConfigurationIds: [],
      comment: ''
    };

    const updatedAssumptions = [...assumptions, newAssumption];
    const updatedProject = addHistoryEntry({ ...project, assumptions: updatedAssumptions }, `Created assumption ${newId}.`);
    onUpdateProject(updatedProject);
    setSelectedId(newId);
  }, [assumptions, project, onUpdateProject, isReadOnly]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isReadOnly) return;
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        handleAdd();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAdd, isReadOnly]);

  const handleUpdate = (field: keyof Assumption, value: any) => {
    if (isReadOnly || !editorState) return;

    const originalAssumption = assumptions.find(a => a.id === editorState.id);
    if (!originalAssumption || JSON.stringify(originalAssumption[field]) === JSON.stringify(value)) {
      // If the value hasn't changed, just update local state without saving
      setEditorState(prev => prev ? { ...prev, [field]: value } : null);
      return;
    }

    const updatedAssumptions = assumptions.map(a => a.id === editorState.id ? { ...editorState, [field]: value } : a);
    const updatedProject = addHistoryEntry({ ...project, assumptions: updatedAssumptions }, `Updated ${field} for assumption ${editorState.id}.`);
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
    if (window.confirm(`Are you sure you want to delete assumption ${selectedId}?`)) {
      const updatedAssumptions = assumptions.filter(a => a.id !== selectedId);
      const updatedProject = addHistoryEntry({ ...project, assumptions: updatedAssumptions }, `Deleted assumption ${selectedId}.`);
      onUpdateProject(updatedProject);
      setSelectedId(updatedAssumptions[0]?.id || null);
    }
  };

  return (
    <div className="flex h-full text-white">
      {/* Assumptions List */}
      <div className="w-1/3 border-r border-gray-700/50 flex flex-col">
        <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Assumptions</h2>
          <button onClick={handleAdd} disabled={isReadOnly} title="Add new assumption (Ctrl + N)" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider">Status</th>
                <th className="p-3 font-semibold tracking-wider">ID</th>
                <th className="p-3 font-semibold tracking-wider">Name</th>
              </tr>
            </thead>
            <tbody>
              {assumptions.map(ass => (
                <tr
                  key={ass.id}
                  onClick={() => setSelectedId(ass.id)}
                  className={`border-t border-gray-700/50 cursor-pointer transition-colors ${selectedId === ass.id ? 'bg-indigo-600/20' : 'hover:bg-gray-800/50'}`}
                >
                  <td className="p-3">
                    <span className={`w-3 h-3 rounded-full inline-block ${ass.active ? 'bg-green-500' : 'bg-gray-500'}`} title={ass.active ? 'Active' : 'Inactive'}></span>
                  </td>
                  <td className="p-3 font-mono text-indigo-400">{ass.id}</td>
                  <td className="p-3">{ass.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumption Editor */}
      <div className="w-2/3 flex-1 overflow-y-auto p-8">
        {editorState ? (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-200">{editorState.id}: {editorState.name}</h2>
              <button onClick={handleDelete} disabled={isReadOnly} className="flex items-center px-3 py-2 bg-red-800/50 text-red-300 rounded-md text-sm font-medium hover:bg-red-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="assId">ID</Label>
                <Input id="assId" type="text" value={editorState.id} onBlur={e => handleUpdate('id', e.target.value)} onChange={e => setEditorState({ ...editorState, id: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="assName">Name</Label>
                <Input id="assName" type="text" value={editorState.name} onBlur={e => handleUpdate('name', e.target.value)} onChange={e => setEditorState({ ...editorState, name: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="assToeIds">TOE Configuration IDs (comma-separated)</Label>
                <Input id="assToeIds" type="text" value={editorState.toeConfigurationIds.join(', ')} onBlur={e => handleUpdate('toeConfigurationIds', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} onChange={e => setEditorState({ ...editorState, toeConfigurationIds: e.target.value.split(',').map(s => s.trim()) })} disabled={isReadOnly} />
              </div>
              <div className="flex items-center pt-5">
                <input id="assActive" type="checkbox" checked={editorState.active} onChange={e => handleUpdate('active', e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed" disabled={isReadOnly} />
                <label htmlFor="assActive" className="ml-3 block text-sm font-medium text-gray-300">Active</label>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="assComment">Comment (RST)</Label>
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
              <Textarea id="assComment" rows={15} value={editorState.comment} onChange={e => setEditorState({ ...editorState, comment: e.target.value })} disabled={isReadOnly} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <h3 className="text-lg">No Assumption Selected</h3>
              <p>Select an assumption from the list or create a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};