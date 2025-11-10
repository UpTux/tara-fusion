

import React, { useEffect, useRef, useState } from 'react';
import { Project, SecurityClaim } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SecurityClaimsViewProps {
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

const MultiSelectDropdown: React.FC<{ options: { id: string, name: string }[], selected: string[], onUpdate: (selected: string[]) => void, label: string, disabled?: boolean }> = ({ options, selected, onUpdate, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  const handleSelect = (optionId: string) => {
    onUpdate(selected.includes(optionId) ? selected.filter(item => item !== optionId) : [...selected, optionId]);
  };

  return (
    <div className="relative" ref={ref}>
      <Label>{label}</Label>
      <button onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className="w-full flex justify-between items-center px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md text-left disabled:opacity-50 disabled:cursor-not-allowed">
        <span className="truncate">{selected.length > 0 ? `${selected.length} selected` : 'Select...'}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-vscode-bg-sidebar border border-vscode-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <label key={option.id} className="flex items-center px-3 py-2 text-sm text-vscode-text-primary hover:bg-vscode-accent/20 cursor-pointer">
              <input type="checkbox" checked={selected.includes(option.id)} onChange={() => handleSelect(option.id)} className="h-4 w-4 rounded border-vscode-border bg-vscode-bg-input text-indigo-600 focus:ring-vscode-accent" />
              <span className="ml-3 truncate" title={option.name}>{option.name} ({option.id})</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export const SecurityClaimsView: React.FC<SecurityClaimsViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [claims, setClaims] = useState<SecurityClaim[]>(project.securityClaims || []);
  const [selectedId, setSelectedId] = useState<string | null>(claims[0]?.id || null);
  const [editorState, setEditorState] = useState<SecurityClaim | null>(null);

  useEffect(() => {
    const currentClaims = project.securityClaims || [];
    setClaims(currentClaims);
    if (!selectedId && currentClaims.length > 0) setSelectedId(currentClaims[0].id);
  }, [project.securityClaims, selectedId]);

  useEffect(() => {
    setEditorState(claims.find(c => c.id === selectedId) || null);
  }, [selectedId, claims]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleAdd = () => {
    if (isReadOnly) return;
    const existingIds = new Set(claims.map(c => c.id));
    let i = 1;
    let newId = `SCLM_${String(i).padStart(3, '0')}`;
    while (existingIds.has(newId)) { i++; newId = `SCLM_${String(i).padStart(3, '0')}`; }

    const newClaim: SecurityClaim = { id: newId, name: 'New Security Claim', responsible: '', assumptionIds: [], comment: '' };
    const updatedClaims = [...claims, newClaim];
    onUpdateProject(addHistoryEntry({ ...project, securityClaims: updatedClaims }, `Created Security Claim ${newId}.`));
    setSelectedId(newId);
  };

  const handleUpdate = (field: keyof SecurityClaim, value: any) => {
    if (isReadOnly || !editorState) return;

    const original = claims.find(c => c.id === editorState.id);
    if (original && JSON.stringify(original[field]) !== JSON.stringify(value)) {
      const updatedClaims = claims.map(c => c.id === editorState.id ? { ...editorState, [field]: value } : c);
      onUpdateProject(addHistoryEntry({ ...project, securityClaims: updatedClaims }, `Updated ${field} for Security Claim ${editorState.id}.`));
    }
  };

  const handleAssumptionLinkUpdate = (newSelectedIds: string[]) => {
    if (isReadOnly || !editorState) return;
    setEditorState({ ...editorState, assumptionIds: newSelectedIds });
    handleUpdate('assumptionIds', newSelectedIds);
  };

  const handleDelete = () => {
    if (isReadOnly || !selectedId) return;
    if (window.confirm(`Are you sure you want to delete Security Claim ${selectedId}? This will remove it from any linked Threat Scenarios.`)) {
      const updatedClaims = claims.filter(c => c.id !== selectedId);
      const updatedScenarios = (project.threatScenarios || []).map(ts => ({ ...ts, securityClaimIds: (ts.securityClaimIds || []).filter(id => id !== selectedId) }));
      onUpdateProject(addHistoryEntry({ ...project, securityClaims: updatedClaims, threatScenarios: updatedScenarios }, `Deleted Security Claim ${selectedId}.`));
      setSelectedId(updatedClaims[0]?.id || null);
    }
  };

  const linkedScenarios = (project.threatScenarios || []).filter(ts => ts.securityClaimIds?.includes(selectedId || ''));

  return (
    <div className="flex h-full text-vscode-text-primary">
      <div className="w-2/5 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-vscode-text-primary">Security Claims</h2>
          <button onClick={handleAdd} title="Add new security claim" className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}><PlusIcon className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
              <tr><th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">ID</th><th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Name</th></tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim.id} onClick={() => setSelectedId(claim.id)} className={`border-t border-vscode-border cursor-pointer transition-colors ${selectedId === claim.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}>
                  <td className="p-3 font-mono text-indigo-400">{claim.id}</td>
                  <td className="p-3 text-vscode-text-primary">{claim.name}</td>
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
              <button onClick={handleDelete} className="flex items-center px-3 py-2 bg-red-800/50 text-red-300 rounded-md text-sm font-medium hover:bg-red-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isReadOnly}><TrashIcon className="w-4 h-4 mr-2" />Delete</button>
            </div>

            <div className="bg-vscode-bg-sidebar p-4 rounded-lg border border-indigo-500/30">
              <h4 className="font-semibold text-indigo-300">What is a Security Claim?</h4>
              <p className="text-sm text-vscode-text-secondary mt-1">A Security Claim is a statement about a risk, used to justify sharing or retaining a risk. One claim must be formulated for each and for each risk with treatment `share`.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="scId">ID</Label><Input id="scId" type="text" value={editorState.id} onChange={e => setEditorState({ ...editorState, id: e.target.value })} onBlur={e => handleUpdate('id', e.target.value)} disabled={isReadOnly} /></div>
              <div><Label htmlFor="scName">Name</Label><Input id="scName" type="text" value={editorState.name} onChange={e => setEditorState({ ...editorState, name: e.target.value })} onBlur={e => handleUpdate('name', e.target.value)} disabled={isReadOnly} /></div>
              <div><Label htmlFor="scResponsible">Responsible</Label><Input id="scResponsible" type="text" placeholder="e.g., Bosch, OEM, Supplier" value={editorState.responsible} onChange={e => setEditorState({ ...editorState, responsible: e.target.value })} onBlur={e => handleUpdate('responsible', e.target.value)} disabled={isReadOnly} /></div>
              <div>
                <MultiSelectDropdown
                  label="Linked Assumptions"
                  options={(project.assumptions || []).map(a => ({ id: a.id, name: a.name }))}
                  selected={editorState.assumptionIds}
                  onUpdate={handleAssumptionLinkUpdate}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div><Label htmlFor="scComment">Comment (RST)</Label><Textarea id="scComment" rows={6} value={editorState.comment} onChange={e => setEditorState({ ...editorState, comment: e.target.value })} onBlur={e => handleUpdate('comment', e.target.value)} disabled={isReadOnly} /></div>

            <div>
              <Label>Justified Threat Scenarios ({linkedScenarios.length})</Label>
              <div className="bg-vscode-bg-sidebar rounded-md border border-vscode-border max-h-48 overflow-y-auto">
                {linkedScenarios.length > 0 ? (
                  <ul className="divide-y divide-vscode-border">
                    {linkedScenarios.map(ts => (
                      <li key={ts.id} className="px-3 py-2 text-sm"><span className="font-mono text-indigo-400 mr-3">{ts.id}</span><span>{ts.name}</span></li>
                    ))}
                  </ul>
                ) : <p className="p-4 text-center text-sm text-vscode-text-secondary">Not linked to any threat scenarios.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary"><div className="text-center"><h3 className="text-lg">No Security Claim Selected</h3><p>Select a claim from the list or create a new one.</p></div></div>
        )}
      </div>
    </div>
  );
};
