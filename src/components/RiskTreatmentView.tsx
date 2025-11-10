

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Project, RiskTreatmentDecision, ThreatScenario } from '../types';
// FIX: `calculateAFL` is not exported from riskService, `calculateAP` is. `getFeasibilityRating` is not exported, `getAttackFeasibilityRating` is.
import { calculateAP, calculateHighestImpact, calculateRiskLevel, getAttackFeasibilityRating, getRiskColor } from '../services/riskService';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

interface RiskTreatmentViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  isReadOnly: boolean;
}

const MultiSelectDropdown: React.FC<{
  options: { id: string, name: string }[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder: string;
  disabled: boolean;
}> = ({ options, selectedIds, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionId: string) => {
    onChange(selectedIds.includes(optionId) ? selectedIds.filter(id => id !== optionId) : [...selectedIds, optionId]);
  };

  const hasSelection = selectedIds && selectedIds.length > 0;
  const buttonText = hasSelection ? `${selectedIds.length} selected` : placeholder;

  return (
    <div className="relative w-full" ref={ref}>
      <button onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className={`w-full flex justify-between items-center px-3 py-1.5 bg-vscode-bg-input border border-vscode-border rounded-md text-left text-sm disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed ${!hasSelection ? 'text-vscode-text-secondary' : 'text-vscode-text-primary'}`}>
        <span className="truncate">{buttonText}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-vscode-bg-sidebar border border-vscode-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {options.map(option => (
            <label key={option.id} className="flex items-center px-3 py-2 text-sm text-vscode-text-primary hover:bg-vscode-accent/20 cursor-pointer">
              <input type="checkbox" checked={selectedIds.includes(option.id)} onChange={() => handleSelect(option.id)} className="h-4 w-4 rounded border-vscode-border bg-vscode-bg-input text-vscode-accent focus:ring-vscode-accent" />
              <span className="ml-3 truncate" title={option.name}>{option.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};


export const RiskTreatmentView: React.FC<RiskTreatmentViewProps> = ({ project, onUpdateProject, isReadOnly }) => {

  const threatScenariosWithRisk = useMemo(() => {
    return (project.threatScenarios || []).map(ts => {
      const impact = calculateHighestImpact(ts.damageScenarioIds, project.damageScenarios || []);
      // FIX: The property is `attackPotential`, not `attackFeasibility`. Use `calculateAP` instead of `calculateAFL`.
      const afl = calculateAP(ts.attackPotential);
      // FIX: The function is named `getAttackFeasibilityRating`.
      const rating = getAttackFeasibilityRating(afl);
      const risk = calculateRiskLevel(rating, impact);
      return { ...ts, risk };
    });
  }, [project.threatScenarios, project.damageScenarios]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleScenarioUpdate = (scenarioId: string, field: keyof ThreatScenario, value: any) => {
    if (isReadOnly) return;
    const updatedScenarios = (project.threatScenarios || []).map(ts =>
      ts.id === scenarioId ? { ...ts, [field]: value } : ts
    );
    const updatedProject = addHistoryEntry(
      { ...project, threatScenarios: updatedScenarios },
      `Updated ${field} for Threat Scenario ${scenarioId}.`
    );
    onUpdateProject(updatedProject);
  };

  return (
    <div className="p-8 text-vscode-text-primary h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-vscode-text-primary">Risk Treatment</h2>
      <p className="mb-6 text-vscode-text-secondary">
        Assign a treatment decision for each threat scenario. Risks marked for reduction must be linked to a Security Goal. Risks that are accepted or transferred must be justified by a Security Claim.
      </p>

      <div className="flex-1 overflow-y-auto bg-vscode-bg-sidebar border border-vscode-border rounded-lg">
        <table className="w-full text-sm text-left table-fixed">
          <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
            <tr>
              <th className="p-4 font-semibold tracking-wider w-[10%]">ID</th>
              <th className="p-4 font-semibold tracking-wider w-[30%]">Threat Scenario</th>
              <th className="p-4 font-semibold tracking-wider w-[12%]">Risk Level</th>
              <th className="p-4 font-semibold tracking-wider w-[18%]">Treatment Decision</th>
              <th className="p-4 font-semibold tracking-wider w-[30%]">Mitigation / Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vscode-border">
            {threatScenariosWithRisk.map(ts => {
              const decision = ts.treatmentDecision || RiskTreatmentDecision.TBD;
              const requiresGoal = decision === RiskTreatmentDecision.REDUCE && (ts.securityGoalIds || []).length === 0;
              const requiresClaim = (decision === RiskTreatmentDecision.ACCEPT || decision === RiskTreatmentDecision.TRANSFER) && (ts.securityClaimIds || []).length === 0;

              return (
                <tr key={ts.id} className="hover:bg-vscode-bg-hover transition-colors">
                  <td className="p-3 align-top font-mono text-indigo-400">{ts.id}</td>
                  <td className="p-3 align-top">
                    <p className="font-medium">{ts.name}</p>
                    <p className="text-xs text-vscode-text-secondary mt-1 truncate">{ts.description}</p>
                  </td>
                  <td className="p-3 align-top">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getRiskColor(ts.risk)}`}>{ts.risk}</span>
                  </td>
                  <td className="p-3 align-top">
                    <select
                      value={decision}
                      onChange={e => handleScenarioUpdate(ts.id, 'treatmentDecision', e.target.value as RiskTreatmentDecision)}
                      className="w-full px-2 py-1.5 bg-vscode-bg-input border border-vscode-border rounded-md text-sm disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed"
                      disabled={isReadOnly}
                    >
                      {Object.values(RiskTreatmentDecision).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="p-3 align-top">
                    {decision === RiskTreatmentDecision.REDUCE && (
                      <div>
                        <MultiSelectDropdown
                          options={(project.securityGoals || []).map(g => ({ id: g.id, name: g.name }))}
                          selectedIds={ts.securityGoalIds || []}
                          onChange={(ids) => handleScenarioUpdate(ts.id, 'securityGoalIds', ids)}
                          placeholder="Link Security Goals..."
                          disabled={isReadOnly}
                        />
                        {requiresGoal && <p className="text-xs text-yellow-400 mt-1 flex items-center"><InformationCircleIcon className="w-4 h-4 mr-1" />At least one goal required.</p>}
                      </div>
                    )}
                    {(decision === RiskTreatmentDecision.ACCEPT || decision === RiskTreatmentDecision.TRANSFER) && (
                      <div>
                        <MultiSelectDropdown
                          options={(project.securityClaims || []).map(c => ({ id: c.id, name: c.name }))}
                          selectedIds={ts.securityClaimIds || []}
                          onChange={(ids) => handleScenarioUpdate(ts.id, 'securityClaimIds', ids)}
                          placeholder="Link Security Claims..."
                          disabled={isReadOnly}
                        />
                        {requiresClaim && <p className="text-xs text-yellow-400 mt-1 flex items-center"><InformationCircleIcon className="w-4 h-4 mr-1" />At least one claim required.</p>}
                      </div>
                    )}
                    {(decision === RiskTreatmentDecision.AVOID || decision === RiskTreatmentDecision.TBD) && (
                      <p className="text-sm text-vscode-text-secondary italic h-full flex items-center">N/A</p>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};