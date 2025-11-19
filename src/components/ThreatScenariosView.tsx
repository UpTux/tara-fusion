import React, { useEffect, useMemo, useRef, useState } from 'react';
import { calculateAttackTreeMetrics } from '../services/attackTreeService';
import { accessOptions, equipmentOptions, expertiseOptions, knowledgeOptions, timeOptions } from '../services/feasibilityOptions';
import { calculateAP, calculateHighestImpact, calculateRiskLevel, getAttackFeasibilityRating, getRiskColor } from '../services/riskService';
import { AttackPotentialTuple, Project, ThreatScenario } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { FeasibilityRatingGuideModal } from './modals/FeasibilityRatingGuideModal';

interface ThreatScenariosViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode; className?: string }> = ({ htmlFor, children, className }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-vscode-text-secondary mb-1 ${className}`}>{children}</label>
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
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex justify-between items-center px-3 py-2 bg-vscode-bg-input border border-vscode-border rounded-md text-left disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed"
      >
        <span className="truncate">{selected.length > 0 ? `${selected.length} selected` : 'Select...'}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && !disabled && (
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

export const ThreatScenariosView: React.FC<ThreatScenariosViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [scenarios, setScenarios] = useState<ThreatScenario[]>(project.threatScenarios || []);
  const [selectedId, setSelectedId] = useState<string | null>(scenarios[0]?.id || null);
  const [editorState, setEditorState] = useState<ThreatScenario | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  useEffect(() => {
    const currentScenarios = project.threatScenarios || [];
    setScenarios(currentScenarios);
    if ((!selectedId && currentScenarios.length > 0) || (selectedId && !currentScenarios.some(s => s.id === selectedId))) {
      setSelectedId(currentScenarios[0]?.id || null)
    }
  }, [project.threatScenarios, selectedId]);

  useEffect(() => {
    const selected = scenarios.find(ds => ds.id === selectedId);
    setEditorState(selected ? { ...selected } : null);
  }, [selectedId, scenarios]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleUpdate = (field: keyof ThreatScenario, value: any) => {
    if (isReadOnly || !editorState) return;

    const originalScenario = scenarios.find(ds => ds.id === editorState.id);
    if (!originalScenario || JSON.stringify(originalScenario[field]) === JSON.stringify(value)) {
      setEditorState(prev => prev ? { ...prev, [field]: value } : null);
      return;
    }

    const updatedScenarios = scenarios.map(ds => ds.id === editorState.id ? { ...editorState, [field]: value } : ds);
    const updatedProject = addHistoryEntry({ ...project, threatScenarios: updatedScenarios }, `Updated ${field} for Threat Scenario ${editorState.id}.`);
    onUpdateProject(updatedProject);
  };

  const handleFeasibilityChange = (field: keyof AttackPotentialTuple, value: number) => {
    if (isReadOnly || !editorState) return;
    const cleanValue = Math.max(0, parseInt(String(value), 10) || 0); // Ensure it's a positive integer
    const newFeasibility = { ...editorState.attackPotential, [field]: cleanValue };
    handleUpdate('attackPotential', newFeasibility);
  };

  const handleDelete = () => {
    if (isReadOnly || !selectedId) return;
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Threat Scenario',
      message: `Are you sure you want to delete Threat Scenario ${selectedId}? This will also remove the link from the parent threat.`,
      onConfirm: () => {
        const scenarioToDelete = scenarios.find(ds => ds.id === selectedId);
        if (!scenarioToDelete) return;

        // Remove the scenario itself
        const updatedScenarios = scenarios.filter(ds => ds.id !== selectedId);

        // Remove the link from the parent threat
        const updatedThreats = (project.threats || []).map(t => {
          if (t.id === scenarioToDelete.threatId) {
            return {
              ...t,
              damageScenarioIds: t.damageScenarioIds.filter(dsId => !scenarioToDelete.damageScenarioIds.includes(dsId))
            }
          }
          return t;
        });

        const updatedProject = addHistoryEntry({ ...project, threats: updatedThreats, threatScenarios: updatedScenarios }, `Deleted Threat Scenario ${selectedId} and its threat link.`);
        onUpdateProject(updatedProject);
        setSelectedId(updatedScenarios[0]?.id || null);
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const derivedImpact = useMemo(() => {
    if (!editorState) return null;
    return calculateHighestImpact(editorState.damageScenarioIds, project.damageScenarios || []);
  }, [editorState, project.damageScenarios]);

  // Legacy calculations (kept for fallback when no attack tree is available)
  const totalAP = useMemo(() => {
    if (!editorState) return null;
    return calculateAP(editorState.attackPotential);
  }, [editorState]);

  const feasibilityRating = useMemo(() => {
    if (totalAP === null) return null;
    return getAttackFeasibilityRating(totalAP);
  }, [totalAP]);

  // Find the corresponding attack tree root for the threat scenario
  const attackTreeMetrics = useMemo(() => {
    if (!editorState) return null;

    // Find the attack-root node that corresponds to this threat scenario's threat
    const attackRootNode = project.needs?.find(need =>
      need.type === 'ATTACK' &&
      need.tags.includes('attack-root') &&
      need.id === editorState.threatId
    );

    if (!attackRootNode) return null;

    // Calculate metrics from the attack tree
    return calculateAttackTreeMetrics(attackRootNode.id, project.needs || [], project.toeConfigurations);
  }, [editorState, project.needs, project.toeConfigurations]);

  // Use calculated attack potential from attack tree if available, otherwise fall back to manual values
  const effectiveAttackPotential = useMemo(() => {
    if (!editorState) return null;

    if (attackTreeMetrics) {
      // If we have attack tree metrics, use the calculated values
      // We need to derive the individual components, but for now use the total AP
      return attackTreeMetrics.attackPotential;
    } else {
      // Fall back to manually entered values
      return calculateAP(editorState.attackPotential);
    }
  }, [editorState, attackTreeMetrics]);

  const effectiveFeasibilityRating = useMemo(() => {
    if (effectiveAttackPotential === null) return null;
    return getAttackFeasibilityRating(effectiveAttackPotential);
  }, [effectiveAttackPotential]);

  const riskLevel = useMemo(() => {
    if (!editorState || !derivedImpact || !effectiveFeasibilityRating) return null;
    return calculateRiskLevel(effectiveFeasibilityRating, derivedImpact);
  }, [editorState, derivedImpact, effectiveFeasibilityRating]);


  const scenariosWithRisk = useMemo(() => {
    return scenarios.map(ts => {
      const impact = calculateHighestImpact(ts.damageScenarioIds, project.damageScenarios || []);

      // Check if this threat scenario has a corresponding attack tree
      const attackRootNode = project.needs?.find(need =>
        need.type === 'ATTACK' &&
        need.tags.includes('attack-root') &&
        need.id === ts.threatId
      );

      let ap: number;
      if (attackRootNode) {
        // Use attack tree calculation
        const treeMetrics = calculateAttackTreeMetrics(attackRootNode.id, project.needs || [], project.toeConfigurations);
        ap = treeMetrics?.attackPotential || Infinity;
      } else {
        // Fall back to manual values
        ap = calculateAP(ts.attackPotential);
      }

      const rating = getAttackFeasibilityRating(ap);
      const risk = calculateRiskLevel(rating, impact);
      return { ...ts, risk };
    })
  }, [scenarios, project.damageScenarios, project.needs, project.toeConfigurations]);

  return (
    <div className="flex h-full text-vscode-text-primary">
      {/* List */}
      <div className="w-2/5 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-vscode-text-primary">Threat Scenarios</h2>
          {/* Add button removed */}
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">ID</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Name</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Risk</th>
              </tr>
            </thead>
            <tbody>
              {scenariosWithRisk.map(ts => (
                <tr
                  key={ts.id}
                  onClick={() => setSelectedId(ts.id)}
                  className={`border-t border-vscode-border cursor-pointer transition-colors ${selectedId === ts.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}
                >
                  <td className="p-3 font-mono text-indigo-400">{ts.id}</td>
                  <td className="p-3 text-vscode-text-primary">{ts.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getRiskColor(ts.risk)}`}>
                      {ts.risk}
                    </span>
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
                <Label htmlFor="tsId">ID</Label>
                <Input id="tsId" type="text" value={editorState.id} onBlur={e => handleUpdate('id', e.target.value)} onChange={e => setEditorState({ ...editorState, id: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="tsName">Name</Label>
                <Input id="tsName" type="text" value={editorState.name} onBlur={e => handleUpdate('name', e.target.value)} onChange={e => setEditorState({ ...editorState, name: e.target.value })} disabled={isReadOnly} />
              </div>
              <div className="col-span-2">
                <Label>Threat</Label>
                <p className="p-2 bg-vscode-bg-sidebar rounded-md text-vscode-text-primary">
                  {project.threats?.find(t => t.id === editorState.threatId)?.name || editorState.threatId}
                </p>
              </div>
              <div className="col-span-2">
                <MultiSelectDropdown
                  label="Resulting Damage Scenarios"
                  options={(project.damageScenarios || []).map(ds => ({ id: ds.id, name: ds.name }))}
                  selected={editorState.damageScenarioIds}
                  onUpdate={() => { }}
                  disabled={true}
                />
              </div>
              <div className="col-span-2">
                <div className="flex items-center mb-1">
                  <Label>Attack Potential</Label>
                  <button onClick={() => setIsGuideModalOpen(true)} className="ml-2 text-vscode-text-secondary hover:text-vscode-text-primary" title="Open Attacker Capability Rating Guide">
                    <InformationCircleIcon className="w-5 h-5" />
                  </button>
                  {attackTreeMetrics && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded-md">
                      Calculated from Attack Tree
                    </span>
                  )}
                </div>

                {attackTreeMetrics ? (
                  <div className="p-4 bg-vscode-bg-sidebar rounded-md border border-vscode-border">
                    <div className="text-center mb-3">
                      <div className="text-sm text-vscode-text-secondary mb-1">Total Attack Potential</div>
                      <div className="text-2xl font-bold font-mono text-indigo-300">
                        {attackTreeMetrics.attackPotential === Infinity ? '∞' : attackTreeMetrics.attackPotential}
                      </div>
                      <div className="text-xs text-vscode-text-secondary mt-1">
                        Calculated from critical attack path in attack tree
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-vscode-text-secondary mb-2">Individual values not available from attack tree calculation</div>
                      <div className="text-xs text-vscode-text-secondary">
                        The attack tree provides the optimal total attack potential based on the critical path analysis.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-4 p-4 bg-vscode-bg-sidebar rounded-md border border-vscode-border">
                    <div>
                      <Label htmlFor="feasibility-time" className="capitalize text-xs">Time</Label>
                      <Select id="feasibility-time" value={editorState.attackPotential.time} onChange={e => handleFeasibilityChange('time', parseInt(e.target.value, 10))} disabled={isReadOnly}>
                        {timeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="feasibility-expertise" className="capitalize text-xs">Expertise</Label>
                      <Select id="feasibility-expertise" value={editorState.attackPotential.expertise} onChange={e => handleFeasibilityChange('expertise', parseInt(e.target.value, 10))} disabled={isReadOnly}>
                        {expertiseOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="feasibility-knowledge" className="capitalize text-xs">Knowledge</Label>
                      <Select id="feasibility-knowledge" value={editorState.attackPotential.knowledge} onChange={e => handleFeasibilityChange('knowledge', parseInt(e.target.value, 10))} disabled={isReadOnly}>
                        {knowledgeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="feasibility-access" className="capitalize text-xs">Access</Label>
                      <Select id="feasibility-access" value={editorState.attackPotential.access} onChange={e => handleFeasibilityChange('access', parseInt(e.target.value, 10))} disabled={isReadOnly}>
                        {accessOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="feasibility-equipment" className="capitalize text-xs">Equipment</Label>
                      <Select id="feasibility-equipment" value={editorState.attackPotential.equipment} onChange={e => handleFeasibilityChange('equipment', parseInt(e.target.value, 10))} disabled={isReadOnly}>
                        {equipmentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>Derived Impact</Label>
                <p className="p-2 bg-vscode-bg-sidebar rounded-md text-vscode-text-primary font-semibold">{derivedImpact}</p>
              </div>
              <div>
                <Label>Calculated AFR (AP)</Label>
                <p className="p-2 bg-vscode-bg-sidebar rounded-md text-vscode-text-primary font-semibold">
                  {effectiveFeasibilityRating} ({effectiveAttackPotential === Infinity ? '∞' : effectiveAttackPotential})
                </p>
              </div>
              <div className="col-span-2">
                <Label>Calculated Risk Level</Label>
                {riskLevel && <p className={`px-3 py-1.5 rounded-md text-sm font-semibold text-white inline-block ${getRiskColor(riskLevel)}`}>{riskLevel}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="tsDesc">Description (RST)</Label>
              <Textarea id="tsDesc" rows={5} value={editorState.description} onBlur={e => handleUpdate('description', e.target.value)} onChange={e => setEditorState({ ...editorState, description: e.target.value })} disabled={isReadOnly} />
            </div>
            <div>
              <Label htmlFor="tsComment">Comment (RST)</Label>
              <Textarea id="tsComment" rows={5} value={editorState.comment} onBlur={e => handleUpdate('comment', e.target.value)} onChange={e => setEditorState({ ...editorState, comment: e.target.value })} disabled={isReadOnly} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary">
            <div className="text-center">
              <h3 className="text-lg">No Threat Scenario Selected</h3>
              <p>Threat Scenarios are created automatically by linking Damage Scenarios to Threats in the 'Threats' view.</p>
            </div>
          </div>
        )}
      </div>

      {isGuideModalOpen && (
        <FeasibilityRatingGuideModal onClose={() => setIsGuideModalOpen(false)} />
      )}
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