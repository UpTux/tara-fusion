

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Asset, Project, Threat, ThreatScenario } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

interface ThreatsViewProps {
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
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  const handleSelect = (optionId: string) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter(item => item !== optionId)
      : [...selected, optionId];
    onUpdate(newSelected);
  };

  return (
    <div className="relative" ref={ref}>
      <Label>{label}</Label>
      <button onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className="w-full flex justify-between items-center px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md text-left disabled:opacity-50 disabled:cursor-not-allowed">
        <span>{selected.length > 0 ? `${selected.length} selected` : 'Select...'}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-vscode-bg-sidebar border border-vscode-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <label key={option.id} className="flex items-center px-3 py-2 text-sm text-vscode-text-primary hover:bg-vscode-accent/20 cursor-pointer">
              <input type="checkbox" checked={selected.includes(option.id)} onChange={() => handleSelect(option.id)} className="h-4 w-4 rounded border-vscode-border bg-vscode-bg-input text-vscode-accent focus:ring-vscode-accent" />
              <span className="ml-3 truncate" title={option.name}>{option.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};


export const ThreatsView: React.FC<ThreatsViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [threats, setThreats] = useState<Threat[]>(project.threats || []);
  const [selectedId, setSelectedId] = useState<string | null>(threats[0]?.id || null);
  const [editorState, setEditorState] = useState<Threat | null>(null);

  const assetsById = useMemo(() =>
    (project.assets || []).reduce((acc, asset) => {
      acc[asset.id] = asset;
      return acc;
    }, {} as Record<string, Asset>),
    [project.assets]);

  const threatsByAsset = useMemo(() => {
    return (project.threats || []).reduce((acc, threat) => {
      if (!acc[threat.assetId]) {
        acc[threat.assetId] = [];
      }
      acc[threat.assetId].push(threat);
      return acc;
    }, {} as Record<string, Threat[]>);
  }, [project.threats]);

  useEffect(() => {
    const currentThreats = project.threats || [];
    setThreats(currentThreats);
    if (!selectedId && currentThreats.length > 0) {
      setSelectedId(currentThreats[0].id);
    }
    // If selectedId points to a threat that no longer exists, reset it
    if (selectedId && !currentThreats.some(t => t.id === selectedId)) {
      setSelectedId(currentThreats[0]?.id || null);
    }
  }, [project.threats, selectedId]);

  useEffect(() => {
    const selected = threats.find(t => t.id === selectedId);
    setEditorState(selected ? { ...selected } : null);
  }, [selectedId, threats]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleUpdate = (field: keyof Threat, value: any) => {
    if (isReadOnly || !editorState) return;
    setEditorState(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleBlur = (field: keyof Threat) => {
    if (isReadOnly || !editorState) return;

    const originalThreat = threats.find(t => t.id === editorState.id);
    if (!originalThreat || JSON.stringify(originalThreat[field]) === JSON.stringify(editorState[field])) {
      return;
    }

    const updatedThreats = threats.map(t => t.id === editorState.id ? editorState : t);
    const updatedProject = addHistoryEntry({ ...project, threats: updatedThreats }, `Updated ${field} for Threat ${editorState.id}.`);
    onUpdateProject(updatedProject);
  };

  const handleMisuseCaseLinkUpdate = (newSelectedIds: string[]) => {
    if (isReadOnly || !editorState) return;

    const field = 'misuseCaseIds';

    setEditorState(prev => prev ? { ...prev, [field]: newSelectedIds } : null);

    const originalThreat = threats.find(t => t.id === editorState.id);
    if (!originalThreat || JSON.stringify(originalThreat[field] || []) === JSON.stringify(newSelectedIds)) {
      return;
    }

    const updatedThreats = threats.map(t => (t.id === editorState.id ? { ...t, [field]: newSelectedIds } : t));
    const updatedProject = addHistoryEntry({ ...project, threats: updatedThreats }, `Updated ${field} for Threat ${editorState.id}.`);
    onUpdateProject(updatedProject);
  }

  const handleDamageScenarioUpdate = (newSelectedIds: string[]) => {
    if (isReadOnly || !editorState) return;

    const originalThreat = project.threats?.find(t => t.id === editorState.id);
    if (!originalThreat) return;

    const oldSelectedIds = originalThreat.damageScenarioIds || [];

    const addedIds = newSelectedIds.filter(id => !oldSelectedIds.includes(id));
    const removedIds = oldSelectedIds.filter(id => !newSelectedIds.includes(id));

    if (addedIds.length === 0 && removedIds.length === 0) return;

    let updatedThreatScenarios = [...(project.threatScenarios || [])];
    let createdScenariosCount = 0;
    let removedScenariosCount = 0;

    if (removedIds.length > 0) {
      updatedThreatScenarios = updatedThreatScenarios.filter(ts => {
        const shouldRemove = ts.threatId === originalThreat.id && removedIds.some(removedId => ts.damageScenarioIds.includes(removedId));
        if (shouldRemove) removedScenariosCount++;
        return !shouldRemove;
      });
    }

    if (addedIds.length > 0) {
      const allScenarioIds = new Set(updatedThreatScenarios.map(ts => ts.id));
      let counter = (project.threatScenarios?.length || 0) + 1;

      addedIds.forEach(dsId => {
        let newId = `TS_${String(counter).padStart(3, '0')}`;
        while (allScenarioIds.has(newId)) {
          counter++;
          newId = `TS_${String(counter).padStart(3, '0')}`;
        }
        allScenarioIds.add(newId);

        const damageScenario = project.damageScenarios?.find(ds => ds.id === dsId);
        const threatName = originalThreat.name;
        const dsName = damageScenario?.name || dsId;

        const newScenario: ThreatScenario = {
          id: newId,
          name: `Scenario for "${threatName}" leading to "${dsName}"`,
          description: `This scenario outlines an attack path for the threat "${threatName}" which results in the damage described in "${dsName}".`,
          threatId: originalThreat.id,
          damageScenarioIds: [dsId],
          attackPotential: { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 },
          comment: ''
        };
        updatedThreatScenarios.push(newScenario);
        createdScenariosCount++;
      });
    }

    const updatedThreats = (project.threats || []).map(t =>
      t.id === originalThreat.id ? { ...t, damageScenarioIds: newSelectedIds } : t
    );

    const historyMessage = `Updated links for threat ${originalThreat.id}. Created ${createdScenariosCount} scenario(s), removed ${removedScenariosCount} scenario(s).`;

    onUpdateProject(addHistoryEntry({
      ...project,
      threats: updatedThreats,
      threatScenarios: updatedThreatScenarios,
    }, historyMessage));
  };


  return (
    <div className="flex h-full text-white">
      {/* Threats List */}
      <div className="w-2/5 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-vscode-text-primary">Threats</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {Object.keys(threatsByAsset).map(assetId => (
            <div key={assetId} className="mb-2">
              <h3 className="p-3 font-semibold tracking-wider bg-vscode-bg-sidebar backdrop-blur-sm sticky top-0 text-indigo-300 border-b border-t border-vscode-border">
                Asset: {assetsById[assetId]?.name || assetId}
              </h3>
              <table className="w-full text-sm text-left">
                <tbody>
                  {(threatsByAsset[assetId] || []).map(threat => (
                    <tr
                      key={threat.id}
                      onClick={() => setSelectedId(threat.id)}
                      className={`border-b border-vscode-border cursor-pointer transition-colors ${selectedId === threat.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}
                    >
                      <td className="p-3 w-1/4 font-mono text-indigo-400">{threat.id}</td>
                      <td className="p-3 w-1/2">{threat.name}</td>
                      <td className="p-3 w-1/4 text-yellow-400 text-xs">{threat.securityProperty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* Threat Editor */}
      <div className="w-3/5 flex-1 overflow-y-auto p-8">
        {editorState ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-vscode-text-primary">{editorState.id}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Label htmlFor="threatName">Name</Label>
                <Input id="threatName" type="text" value={editorState.name} onBlur={() => handleBlur('name')} onChange={e => handleUpdate('name', e.target.value)} disabled={isReadOnly} />
              </div>
              <div>
                <Label>Asset</Label>
                <p className="p-2 bg-vscode-bg-sidebar rounded-md text-vscode-text-primary">{assetsById[editorState.assetId]?.name}</p>
              </div>
              <div>
                <Label>Security Property</Label>
                <p className="p-2 bg-vscode-bg-sidebar rounded-md text-vscode-text-primary">{editorState.securityProperty}</p>
              </div>
              <div>
                <Label>AFR (Initial / Residual)</Label>
                <p className="p-2 bg-vscode-bg-sidebar rounded-md text-vscode-text-primary font-mono">{editorState.initialAFR} / {editorState.residualAFR}</p>
              </div>
              <div className="col-span-2">
                <MultiSelectDropdown
                  label="Damage Scenarios"
                  options={(project.damageScenarios || []).map(ds => ({ id: ds.id, name: ds.name }))}
                  selected={editorState.damageScenarioIds}
                  onUpdate={handleDamageScenarioUpdate}
                  disabled={isReadOnly}
                />
                <p className="text-xs text-vscode-text-secondary mt-1.5 px-1">
                  Only link damage scenarios directly caused by this threat. Indirect relationships should be modeled in the attack tree.
                </p>
              </div>
              <div className="col-span-2">
                <MultiSelectDropdown
                  label="Misuse Cases"
                  options={(project.misuseCases || []).map(mc => ({ id: mc.id, name: mc.name }))}
                  selected={editorState.misuseCaseIds || []}
                  onUpdate={handleMisuseCaseLinkUpdate}
                  disabled={isReadOnly}
                />
                <p className="text-xs text-vscode-text-secondary mt-1.5 px-1">
                  Link relevant misuse cases that are realized by this threat.
                </p>
              </div>
              <div className="col-span-2 flex items-center pt-2">
                <input id="threatScales" type="checkbox" checked={editorState.scales} onBlur={() => handleBlur('scales')} onChange={e => handleUpdate('scales', e.target.checked)} className="h-4 w-4 rounded border-vscode-border bg-vscode-bg-input text-vscode-accent focus:ring-vscode-accent disabled:cursor-not-allowed" disabled={isReadOnly} />
                <div className="relative group flex items-center">
                  <label htmlFor="threatScales" className="ml-3 block text-sm font-medium text-vscode-text-primary">Threat scales</label>
                  <InformationCircleIcon className="w-4 h-4 ml-2 text-vscode-text-secondary" />
                  <div className="absolute bottom-full left-0 mb-2 w-96 hidden group-hover:block bg-vscode-bg-sidebar border border-vscode-border text-white text-xs rounded-lg p-3 z-20 shadow-lg animate-fade-in-fast">
                    <h4 className="font-bold mb-1">Scaling Effects</h4>
                    <p className="mb-2">An attack path scales if it can be executed automatically, without human interaction, after it has been executed once. A threat scales if one or more of its critical attack paths scale.</p>
                    <p className="text-vscode-text-secondary mb-2 text-[11px]">Note: This setting is for informational purposes and does not influence risk calculations.</p>
                    <div className="border-t border-vscode-border pt-2 mt-2">
                      <p className="font-semibold">Example (Scales):</p>
                      <p className="font-mono text-[11px] whitespace-pre-wrap">
                        {`► Reverse engineer firmware (once)
► Develop exploit (once)
► Connect to vehicle via Internet (scripted)
► Run exploit (scripted)`}
                      </p>
                    </div>
                    <div className="border-t border-vscode-border pt-2 mt-2">
                      <p className="font-semibold">Example (Does NOT Scale):</p>
                      <p className="font-mono text-[11px] whitespace-pre-wrap">
                        {`► Develop manipulated firmware (once)
► Connect to ECU via JTAG (manual, per vehicle)
► Flash firmware (scripted, but requires physical presence)`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="threatReasoning">Reasoning for scaling effects (RST)</Label>
              <Textarea id="threatReasoning" rows={5} value={editorState.reasoningScaling} onBlur={() => handleBlur('reasoningScaling')} onChange={e => handleUpdate('reasoningScaling', e.target.value)} disabled={isReadOnly} />
            </div>

            <div>
              <Label htmlFor="threatComment">Comment (RST)</Label>
              <Textarea id="threatComment" rows={8} value={editorState.comment} onBlur={() => handleBlur('comment')} onChange={e => handleUpdate('comment', e.target.value)} disabled={isReadOnly} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary">
            <div className="text-center">
              <h3 className="text-lg">No Threat Selected</h3>
              <p>Threats are generated automatically based on Assets and their Security Properties.</p>
              <p className="mt-2 text-sm">Select a threat from the list to view its details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
