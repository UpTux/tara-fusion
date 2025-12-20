

import React, { useEffect, useState, useRef } from 'react';
import { Project, SecurityGoal } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './modals/ConfirmationModal';

interface SecurityGoalsViewProps {
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

export const SecurityGoalsView: React.FC<SecurityGoalsViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [selectedId, setSelectedId] = useState<string | null>(() => (project.securityGoals || [])[0]?.id || null);
  const [editorState, setEditorState] = useState<SecurityGoal | null>(() => {
    const goals = project.securityGoals || [];
    const first = goals[0];
    return first ? { ...first } : null;
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const lastSyncedRef = useRef<SecurityGoal | null>(editorState);

  useEffect(() => {
    const goals = project.securityGoals || [];
    const selected = goals.find(g => g.id === selectedId);
    if (JSON.stringify(selected ? { ...selected } : null) !== JSON.stringify(lastSyncedRef.current)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditorState(selected ? { ...selected } : null);
      lastSyncedRef.current = selected ? { ...selected } : null;
    }
  }, [selectedId, project.securityGoals]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleAdd = () => {
    if (isReadOnly) return;
    const goals = project.securityGoals || [];
    const existingIds = new Set(goals.map(g => g.id));
    let i = 1;
    let newId = `SG_${String(i).padStart(3, '0')}`;
    while (existingIds.has(newId)) { i++; newId = `SG_${String(i).padStart(3, '0')}`; }

    const newGoal: SecurityGoal = {
      id: newId,
      name: 'New Security Goal',
      responsible: '',
      requirementsLink: '',
      comment: '',
    };

    const updatedGoals = [...goals, newGoal];
    onUpdateProject(addHistoryEntry({ ...project, securityGoals: updatedGoals }, `Created Security Goal ${newId}.`));
    setSelectedId(newId);
  };

  const handleUpdate = (field: keyof SecurityGoal, value: any) => {
    if (isReadOnly || !editorState) return;

    setEditorState(prev => prev ? { ...prev, [field]: value } : null);

    const goals = project.securityGoals || [];
    const original = goals.find(g => g.id === editorState.id);
    if (!original || JSON.stringify(original[field]) === JSON.stringify(value)) {
      return;
    }

    const updatedGoals = goals.map(g => g.id === editorState.id ? { ...editorState, [field]: value } : g);
    onUpdateProject(addHistoryEntry({ ...project, securityGoals: updatedGoals }, `Updated ${field} for Security Goal ${editorState.id}.`));
  };

  const handleDeleteRequest = () => {
    if (isReadOnly || !selectedId) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedId) return;

    const goals = project.securityGoals || [];
    const updatedGoals = goals.filter(g => g.id !== selectedId);
    const updatedScenarios = (project.threatScenarios || []).map(ts => ({
      ...ts,
      securityGoalIds: (ts.securityGoalIds || []).filter(id => id !== selectedId)
    }));

    onUpdateProject(addHistoryEntry({ ...project, securityGoals: updatedGoals, threatScenarios: updatedScenarios }, `Deleted Security Goal ${selectedId}.`));
    setSelectedId(updatedGoals[0]?.id || null);
    setIsDeleteModalOpen(false);
  };

  const linkedScenarios = (project.threatScenarios || []).filter(ts => ts.securityGoalIds?.includes(selectedId || ''));

  return (
    <div className="flex h-full text-vscode-text-primary">
      <div className="w-2/5 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-vscode-text-primary">Security Goals</h2>
          <button onClick={handleAdd} title="Add new security goal" className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}><PlusIcon className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">ID</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Name</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Responsible</th>
              </tr>
            </thead>
            <tbody>
              {(project.securityGoals || []).map(goal => (
                <tr key={goal.id} onClick={() => setSelectedId(goal.id)} className={`border-t border-vscode-border cursor-pointer transition-colors ${selectedId === goal.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}>
                  <td className="p-3 font-mono text-indigo-400">{goal.id}</td>
                  <td className="p-3 text-vscode-text-primary">{goal.name}</td>
                  <td className="p-3 text-vscode-text-secondary truncate">{goal.responsible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-3/5 flex-1 overflow-y-auto p-8">
        {editorState ? (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-vscode-text-primary">{editorState.id}: {editorState.name}</h2>
              <button onClick={handleDeleteRequest} className="flex items-center px-3 py-2 bg-red-800/50 text-red-300 rounded-md text-sm font-medium hover:bg-red-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}><TrashIcon className="w-4 h-4 mr-2" />Delete</button>
            </div>

            <div className="bg-vscode-bg-sidebar p-4 rounded-lg border border-indigo-500/30">
              <h4 className="font-semibold text-indigo-300">What is a Security Goal?</h4>
              <p className="text-sm text-vscode-text-secondary mt-1">A Security Goal is something that can be met or achieved by introducing an appropriate measure within the scope of the TOE. In contrast, a Security Claim is something that must be assumed, often linked to an assumption.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="sgId">ID</Label><Input id="sgId" type="text" value={editorState.id} onChange={e => setEditorState({ ...editorState, id: e.target.value })} onBlur={e => handleUpdate('id', e.target.value)} disabled={isReadOnly} /></div>
              <div><Label htmlFor="sgName">Name</Label><Input id="sgName" type="text" value={editorState.name} onChange={e => setEditorState({ ...editorState, name: e.target.value })} onBlur={e => handleUpdate('name', e.target.value)} disabled={isReadOnly} /></div>
              <div><Label htmlFor="sgResponsible">Responsible</Label><Input id="sgResponsible" type="text" placeholder="e.g., Bosch, OEM, Supplier" value={editorState.responsible} onChange={e => setEditorState({ ...editorState, responsible: e.target.value })} onBlur={e => handleUpdate('responsible', e.target.value)} disabled={isReadOnly} /></div>
              <div><Label htmlFor="sgReqLink">Requirements Link</Label><Input id="sgReqLink" type="text" placeholder="e.g., https://jira.example.com/REQ-123" value={editorState.requirementsLink} onChange={e => setEditorState({ ...editorState, requirementsLink: e.target.value })} onBlur={e => handleUpdate('requirementsLink', e.target.value)} disabled={isReadOnly} /></div>
            </div>

            <div><Label htmlFor="sgComment">Comment (RST)</Label><Textarea id="sgComment" rows={6} value={editorState.comment} onChange={e => setEditorState({ ...editorState, comment: e.target.value })} onBlur={e => handleUpdate('comment', e.target.value)} disabled={isReadOnly} /></div>

            <div>
              <Label>Mitigated Threat Scenarios ({linkedScenarios.length})</Label>
              <div className="bg-vscode-bg-sidebar rounded-md border border-vscode-border max-h-48 overflow-y-auto">
                {linkedScenarios.length > 0 ? (
                  <ul className="divide-y divide-vscode-border">
                    {linkedScenarios.map(ts => (
                      <li key={ts.id} className="px-3 py-2 text-sm">
                        <span className="font-mono text-indigo-400 mr-3">{ts.id}</span>
                        <span>{ts.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="p-4 text-center text-sm text-vscode-text-secondary">Not linked to any threat scenarios.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary"><div className="text-center"><h3 className="text-lg">No Security Goal Selected</h3><p>Select a goal from the list or create a new one.</p></div></div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Security Goal"
        message={`Are you sure you want to delete Security Goal ${selectedId}? This will remove it from any linked Threat Scenarios.`}
        confirmLabel="Delete"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
