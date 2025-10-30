

import React, { useState, useEffect } from 'react';
import { Project, SecurityGoal, ThreatScenario } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SecurityGoalsViewProps {
  project: Project;
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

export const SecurityGoalsView: React.FC<SecurityGoalsViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [goals, setGoals] = useState<SecurityGoal[]>(project.securityGoals || []);
  const [selectedId, setSelectedId] = useState<string | null>(goals[0]?.id || null);
  const [editorState, setEditorState] = useState<SecurityGoal | null>(null);

  useEffect(() => {
    const currentGoals = project.securityGoals || [];
    setGoals(currentGoals);
    if (!selectedId && currentGoals.length > 0) {
      setSelectedId(currentGoals[0].id);
    }
  }, [project.securityGoals, selectedId]);

  useEffect(() => {
    const selected = goals.find(g => g.id === selectedId);
    setEditorState(selected ? { ...selected } : null);
  }, [selectedId, goals]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleAdd = () => {
    if (isReadOnly) return;
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

    const original = goals.find(g => g.id === editorState.id);
    if (original && JSON.stringify(original[field]) !== JSON.stringify(value)) {
      const updatedGoals = goals.map(g => g.id === editorState.id ? { ...editorState, [field]: value } : g);
      onUpdateProject(addHistoryEntry({ ...project, securityGoals: updatedGoals }, `Updated ${field} for Security Goal ${editorState.id}.`));
    }
  };
  
  const handleDelete = () => {
    if (isReadOnly || !selectedId) return;
    if (window.confirm(`Are you sure you want to delete Security Goal ${selectedId}? This will remove it from any linked Threat Scenarios.`)) {
      const updatedGoals = goals.filter(g => g.id !== selectedId);
      const updatedScenarios = (project.threatScenarios || []).map(ts => ({
        ...ts,
        securityGoalIds: (ts.securityGoalIds || []).filter(id => id !== selectedId)
      }));

      onUpdateProject(addHistoryEntry({ ...project, securityGoals: updatedGoals, threatScenarios: updatedScenarios }, `Deleted Security Goal ${selectedId}.`));
      setSelectedId(updatedGoals[0]?.id || null);
    }
  };

  const linkedScenarios = (project.threatScenarios || []).filter(ts => ts.securityGoalIds?.includes(selectedId || ''));

  return (
    <div className="flex h-full text-white">
      <div className="w-2/5 border-r border-gray-700/50 flex flex-col">
        <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Security Goals</h2>
          <button onClick={handleAdd} title="Add new security goal" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}><PlusIcon className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider">ID</th>
                <th className="p-3 font-semibold tracking-wider">Name</th>
                <th className="p-3 font-semibold tracking-wider">Responsible</th>
              </tr>
            </thead>
            <tbody>
              {goals.map(goal => (
                <tr key={goal.id} onClick={() => setSelectedId(goal.id)} className={`border-t border-gray-700/50 cursor-pointer transition-colors ${selectedId === goal.id ? 'bg-indigo-600/20' : 'hover:bg-gray-800/50'}`}>
                  <td className="p-3 font-mono text-indigo-400">{goal.id}</td>
                  <td className="p-3 truncate">{goal.name}</td>
                  <td className="p-3 text-gray-400 truncate">{goal.responsible}</td>
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
              <h2 className="text-2xl font-bold text-gray-200">{editorState.id}: {editorState.name}</h2>
              <button onClick={handleDelete} className="flex items-center px-3 py-2 bg-red-800/50 text-red-300 rounded-md text-sm font-medium hover:bg-red-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}><TrashIcon className="w-4 h-4 mr-2"/>Delete</button>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg border border-indigo-500/30">
                <h4 className="font-semibold text-indigo-300">What is a Security Goal?</h4>
                <p className="text-sm text-gray-400 mt-1">A Security Goal is something that can be met or achieved by introducing an appropriate measure within the scope of the TOE. In contrast, a Security Claim is something that must be assumed, often linked to an assumption.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="sgId">ID</Label><Input id="sgId" type="text" value={editorState.id} onChange={e => setEditorState({...editorState, id: e.target.value})} onBlur={e => handleUpdate('id', e.target.value)} disabled={isReadOnly} /></div>
              <div><Label htmlFor="sgName">Name</Label><Input id="sgName" type="text" value={editorState.name} onChange={e => setEditorState({...editorState, name: e.target.value})} onBlur={e => handleUpdate('name', e.target.value)} disabled={isReadOnly} /></div>
              <div><Label htmlFor="sgResponsible">Responsible</Label><Input id="sgResponsible" type="text" placeholder="e.g., Bosch, OEM, Supplier" value={editorState.responsible} onChange={e => setEditorState({...editorState, responsible: e.target.value})} onBlur={e => handleUpdate('responsible', e.target.value)} disabled={isReadOnly} /></div>
              <div><Label htmlFor="sgReqLink">Requirements Link</Label><Input id="sgReqLink" type="text" placeholder="e.g., https://jira.example.com/REQ-123" value={editorState.requirementsLink} onChange={e => setEditorState({...editorState, requirementsLink: e.target.value})} onBlur={e => handleUpdate('requirementsLink', e.target.value)} disabled={isReadOnly} /></div>
            </div>
            
            <div><Label htmlFor="sgComment">Comment (RST)</Label><Textarea id="sgComment" rows={6} value={editorState.comment} onChange={e => setEditorState({...editorState, comment: e.target.value})} onBlur={e => handleUpdate('comment', e.target.value)} disabled={isReadOnly} /></div>
            
            <div>
              <Label>Mitigated Threat Scenarios ({linkedScenarios.length})</Label>
              <div className="bg-gray-900/50 rounded-md border border-gray-700/50 max-h-48 overflow-y-auto">
                {linkedScenarios.length > 0 ? (
                  <ul className="divide-y divide-gray-700/50">
                    {linkedScenarios.map(ts => (
                      <li key={ts.id} className="px-3 py-2 text-sm">
                        <span className="font-mono text-indigo-400 mr-3">{ts.id}</span>
                        <span>{ts.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="p-4 text-center text-sm text-gray-500">Not linked to any threat scenarios.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500"><div className="text-center"><h3 className="text-lg">No Security Goal Selected</h3><p>Select a goal from the list or create a new one.</p></div></div>
        )}
      </div>
    </div>
  );
};
