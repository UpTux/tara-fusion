
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MisuseCase, Project } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './modals/ConfirmationModal';

interface MisuseCasesViewProps {
  project: Project;
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

export const MisuseCasesView: React.FC<MisuseCasesViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [misuseCases, setMisuseCases] = useState<MisuseCase[]>(() => project.misuseCases || []);
  const [selectedId, setSelectedId] = useState<string | null>(() => (project.misuseCases || [])[0]?.id || null);
  const [editorState, setEditorState] = useState<MisuseCase | null>(() => {
    const firstCase = (project.misuseCases || [])[0];
    return firstCase ? { ...firstCase } : null;
  });
  const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const linkedThreatsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    (project.misuseCases || []).forEach(mc => map.set(mc.id, []));
    (project.threats || []).forEach(threat => {
      (threat.misuseCaseIds || []).forEach(mcId => {
        const threats = map.get(mcId);
        if (threats) {
          threats.push(threat.id);
        }
      });
    });
    return map;
  }, [project.misuseCases, project.threats]);

  // Track last upstream-synced snapshot to avoid circular deps and unnecessary effect runs
  const lastSyncedRef = useRef<MisuseCase | null>(editorState);

  useEffect(() => {
    // Intentionally omit editorState from deps: this effect synchronizes local editor from upstream
    // selection/data changes only. Local edits should not re-trigger this synchronization.
    const selectedCase = (project.misuseCases || []).find(a => a.id === selectedId) || null;
    if (JSON.stringify(selectedCase) !== JSON.stringify(lastSyncedRef.current)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditorState(selectedCase ? { ...selectedCase } : null);
      lastSyncedRef.current = selectedCase ? { ...selectedCase } : null;
    }
  }, [selectedId, project.misuseCases]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleAdd = useCallback(() => {
    if (isReadOnly) return;
    const existingIds = new Set((project.misuseCases || []).map(a => a.id));
    let i = 1;
    let newId = `MC_${String(i).padStart(3, '0')}`;
    while (existingIds.has(newId)) { i++; newId = `MC_${String(i).padStart(3, '0')}`; }

    const newMisuseCase: MisuseCase = {
      id: newId,
      name: 'New Misuse Case',
      description: '',
      comment: ''
    };

    const updatedMisuseCases = [...(project.misuseCases || []), newMisuseCase];
    const updatedProject = addHistoryEntry({ ...project, misuseCases: updatedMisuseCases }, `Created misuse case ${newId}.`);
    onUpdateProject(updatedProject);
    setSelectedId(newId);
  }, [project.misuseCases, project, onUpdateProject, isReadOnly]);

  const handleUpdate = (field: keyof MisuseCase, value: any) => {
    if (isReadOnly || !editorState) return;

    const original = (project.misuseCases || []).find(a => a.id === editorState.id);
    if (original && JSON.stringify(original[field]) !== JSON.stringify(value)) {
      const updatedMisuseCases = (project.misuseCases || []).map(a => a.id === editorState.id ? { ...editorState, [field]: value } : a);
      const updatedProject = addHistoryEntry({ ...project, misuseCases: updatedMisuseCases }, `Updated ${field} for misuse case ${editorState.id}.`);
      onUpdateProject(updatedProject);
    }
  };

  const handleDelete = () => {
    if (isReadOnly || !selectedId) return;
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Misuse Case',
      message: `Are you sure you want to delete misuse case ${selectedId}? This will also remove links from any threats.`,
      onConfirm: () => {
        const updatedMisuseCases = (project.misuseCases || []).filter(a => a.id !== selectedId);

        const updatedThreats = (project.threats || []).map(t => ({
          ...t,
          misuseCaseIds: (t.misuseCaseIds || []).filter(mcId => mcId !== selectedId)
        }));

        const updatedProject = addHistoryEntry({ ...project, misuseCases: updatedMisuseCases, threats: updatedThreats }, `Deleted misuse case ${selectedId}.`);
        onUpdateProject(updatedProject);
        setSelectedId(updatedMisuseCases[0]?.id || null);
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="flex h-full text-vscode-text-primary">
      {/* List */}
      <div className="w-2/5 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-vscode-text-primary">Misuse Cases</h2>
          <button onClick={handleAdd} title="Add new misuse case" className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}>
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">ID</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Name</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Status</th>
              </tr>
            </thead>
            <tbody>
              {misuseCases.map(mc => (
                <tr
                  key={mc.id}
                  onClick={() => setSelectedId(mc.id)}
                  className={`border-t border-vscode-border cursor-pointer transition-colors ${selectedId === mc.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}
                >
                  <td className="p-3 font-mono text-indigo-400">{mc.id}</td>
                  <td className="p-3 text-vscode-text-primary">{mc.name}</td>
                  <td className="p-3">
                    {(linkedThreatsMap.get(mc.id)?.length || 0) > 0
                      ? <span className="px-2 py-1 text-xs font-medium bg-green-800/50 text-green-300 rounded-full" title={`Linked to: ${linkedThreatsMap.get(mc.id)?.join(', ')}`}>
                        {linkedThreatsMap.get(mc.id)?.length} Linked
                      </span>
                      : <span className="px-2 py-1 text-xs font-medium bg-yellow-800/50 text-yellow-300 rounded-full">Unlinked</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor */}
      <div className="w-3/5 flex-1 overflow-y-auto p-8">
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
                <Label htmlFor="mcId">ID</Label>
                <Input id="mcId" type="text" value={editorState.id} onBlur={e => handleUpdate('id', e.target.value)} onChange={e => setEditorState({ ...editorState, id: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="mcName">Name</Label>
                <Input id="mcName" type="text" value={editorState.name} onBlur={e => handleUpdate('name', e.target.value)} onChange={e => setEditorState({ ...editorState, name: e.target.value })} disabled={isReadOnly} />
              </div>
            </div>
            <div>
              <Label htmlFor="mcDescription">Description</Label>
              <Textarea id="mcDescription" rows={6} value={editorState.description} onBlur={e => handleUpdate('description', e.target.value)} onChange={e => setEditorState({ ...editorState, description: e.target.value })} disabled={isReadOnly} />
            </div>
            <div>
              <Label htmlFor="mcComment">Comment (RST)</Label>
              <Textarea id="mcComment" rows={10} value={editorState.comment} onBlur={e => handleUpdate('comment', e.target.value)} onChange={e => setEditorState({ ...editorState, comment: e.target.value })} disabled={isReadOnly} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary">
            <div className="text-center">
              <h3 className="text-lg">No Misuse Case Selected</h3>
              <p>Select a misuse case from the list or create a new one.</p>
            </div>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmLabel="Delete"
        isDangerous={true}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
