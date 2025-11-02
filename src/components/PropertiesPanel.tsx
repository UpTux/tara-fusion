

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { attackerTypePresets } from '../services/attackerTypes';
import { calculateNodeMetrics } from '../services/attackTreeService';
import { accessOptions, equipmentOptions, expertiseOptions, knowledgeOptions, timeOptions } from '../services/feasibilityOptions';
import { getAttackFeasibilityRating, getFeasibilityRatingColor } from '../services/riskService';
import { AttackPotentialTuple, AttackerType, NeedStatus, NeedType, Project, SphinxNeed } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface PropertiesPanelProps {
    need: SphinxNeed;
    project: Project;
    onChange: (updatedNeed: SphinxNeed) => void;
    isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-400 mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} rows={4} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
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
            <button onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className="w-full flex justify-between items-center px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-left disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="truncate">{selected.length > 0 ? `${selected.length} selected` : 'Select...'}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <label key={option.id} className="flex items-center px-3 py-2 text-sm text-white hover:bg-indigo-600/20 cursor-pointer">
                            <input type="checkbox" checked={selected.includes(option.id)} onChange={() => handleSelect(option.id)} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500" />
                            <span className="ml-3 truncate" title={option.name}>{option.name} ({option.id})</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};


export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ need, project, onChange, isReadOnly }) => {

    const handleChange = (field: keyof SphinxNeed, value: any) => {
        if (isReadOnly) return;
        onChange({ ...need, [field]: value });
    };

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        const tags = e.target.value.split(',').map(tag => tag.trim());
        handleChange('tags', tags);
    }

    const handlePotentialChange = (field: keyof AttackPotentialTuple, value: string) => {
        if (isReadOnly) return;
        const numericValue = Math.max(0, parseInt(value, 10) || 0);
        const newPotential = {
            ...(need.attackPotential || { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 }),
            [field]: numericValue
        };
        onChange({ ...need, attackPotential: newPotential });
    };

    const handleLogicGateChange = (value: 'LEAF' | 'AND' | 'OR') => {
        if (isReadOnly) return;

        // Don't allow changing root nodes
        if (need.tags.includes('attack-root')) return;

        if (value === 'LEAF') {
            const { logic_gate, ...rest } = need;
            const updatedNeed = { ...rest };
            // Add default potential if it doesn't exist
            if (!updatedNeed.attackPotential) {
                updatedNeed.attackPotential = { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 };
            }
            onChange(updatedNeed);
        } else {
            const { attackPotential, ...rest } = need;
            const updatedNeed = { ...rest, logic_gate: value as 'AND' | 'OR' };
            onChange(updatedNeed);
        }
    };

    const handleAttackerTypeChange = (value: AttackerType) => {
        if (isReadOnly) return;
        const preset = attackerTypePresets[value];
        const newPotential = {
            ...(need.attackPotential || { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 }),
            ...preset,
        };
        onChange({ ...need, attackerType: value, attackPotential: newPotential });
    };

    const handleToeConfigChange = (ids: string[]) => {
        if (isReadOnly) return;
        onChange({ ...need, toeConfigurationIds: ids });
    };

    const isLeaf = need.type === NeedType.ATTACK && !need.tags.includes('attack-root') && !need.logic_gate;
    const isIntermediate = need.type === NeedType.ATTACK && !isLeaf && !need.tags.includes('attack-root');
    const isRoot = need.type === NeedType.ATTACK && (need.tags.includes('attack-root') || need.tags.includes('circumvent-root'));
    const selectedAttackerType = need.attackerType || AttackerType.NONE;
    const isPreset = selectedAttackerType !== AttackerType.NONE;

    // Calculate metrics for intermediate and root nodes
    const calculatedMetrics = useMemo(() => {
        if (isIntermediate || isRoot) {
            return calculateNodeMetrics(need.id, project.needs, project.toeConfigurations);
        }
        return null;
    }, [need.id, project.needs, project.toeConfigurations, isIntermediate, isRoot]);

    return (
        <aside className="w-96 bg-gray-900/80 border-l border-gray-700/50 p-6 overflow-y-auto flex-shrink-0">
            <h2 className="text-lg font-bold text-white mb-6">Properties</h2>
            <div className="space-y-6">
                <div>
                    <Label htmlFor="id">ID</Label>
                    <Input id="id" type="text" value={need.id} onChange={(e) => handleChange('id', e.target.value)} disabled={isReadOnly} />
                </div>
                <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" type="text" value={need.title} onChange={(e) => handleChange('title', e.target.value)} disabled={isReadOnly} />
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={need.description} onChange={(e) => handleChange('description', e.target.value)} disabled={isReadOnly} />
                </div>
                <div>
                    <Label htmlFor="type">Type</Label>
                    <Select id="type" value={need.type} onChange={(e) => handleChange('type', e.target.value as NeedType)} disabled={isReadOnly}>
                        {Object.values(NeedType).map(type => <option key={type} value={type}>{type}</option>)}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select id="status" value={need.status} onChange={(e) => handleChange('status', e.target.value as NeedStatus)} disabled={isReadOnly}>
                        {Object.values(NeedStatus).map(status => <option key={status} value={status}>{status}</option>)}
                    </Select>
                </div>
                {need.type === NeedType.ATTACK && (
                    <div>
                        <Label htmlFor="logic_gate">Logic Gate (Node Type)</Label>
                        <Select
                            id="logic_gate"
                            value={need.logic_gate || 'LEAF'}
                            onChange={(e) => handleLogicGateChange(e.target.value as 'LEAF' | 'AND' | 'OR')}
                            disabled={isReadOnly || need.tags.includes('attack-root')}
                        >
                            <option value="LEAF">Attack Leaf (None)</option>
                            <option value="OR">Intermediate (OR)</option>
                            <option value="AND">Intermediate (AND)</option>
                        </Select>
                        {need.tags.includes('attack-root') && (
                            <p className="text-xs text-gray-500 mt-1">Root nodes cannot change their logic gate type</p>
                        )}
                    </div>
                )}
                {(isIntermediate || isRoot) && calculatedMetrics && calculatedMetrics.hasSubtree && (
                    <div>
                        <Label>Calculated Attack Metrics</Label>
                        <div className="space-y-3 p-3 bg-gray-800/50 rounded-md border border-gray-700/50">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-600/50">
                                <span className="text-sm font-medium text-gray-300">Total AP:</span>
                                <span className="text-lg font-bold font-mono text-indigo-300">
                                    {calculatedMetrics.attackPotential === Infinity ? '∞' : calculatedMetrics.attackPotential}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-600/50">
                                <span className="text-sm font-medium text-gray-300">Feasibility (AFR):</span>
                                <span className={`px-2 py-1 rounded text-sm font-bold ${getFeasibilityRatingColor(getAttackFeasibilityRating(calculatedMetrics.attackPotential))}`}>
                                    {getAttackFeasibilityRating(calculatedMetrics.attackPotential)}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 mb-2">Critical Path Properties:</div>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Time:</span>
                                    <span className="ml-1 font-mono text-white">
                                        {calculatedMetrics.attackPotentialTuple.time}
                                        <span className="ml-1 text-gray-500 font-normal">
                                            ({timeOptions.find(opt => opt.value === calculatedMetrics.attackPotentialTuple.time)?.label.split(': ')[1] || 'Unknown'})
                                        </span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Expertise:</span>
                                    <span className="ml-1 font-mono text-white">
                                        {calculatedMetrics.attackPotentialTuple.expertise}
                                        <span className="ml-1 text-gray-500 font-normal">
                                            ({expertiseOptions.find(opt => opt.value === calculatedMetrics.attackPotentialTuple.expertise)?.label.split(': ')[1] || 'Unknown'})
                                        </span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Knowledge:</span>
                                    <span className="ml-1 font-mono text-white">
                                        {calculatedMetrics.attackPotentialTuple.knowledge}
                                        <span className="ml-1 text-gray-500 font-normal">
                                            ({knowledgeOptions.find(opt => opt.value === calculatedMetrics.attackPotentialTuple.knowledge)?.label.split(': ')[1] || 'Unknown'})
                                        </span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Access:</span>
                                    <span className="ml-1 font-mono text-white">
                                        {calculatedMetrics.attackPotentialTuple.access}
                                        <span className="ml-1 text-gray-500 font-normal">
                                            ({accessOptions.find(opt => opt.value === calculatedMetrics.attackPotentialTuple.access)?.label.split(': ')[1] || 'Unknown'})
                                        </span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Equipment:</span>
                                    <span className="ml-1 font-mono text-white">
                                        {calculatedMetrics.attackPotentialTuple.equipment}
                                        <span className="ml-1 text-gray-500 font-normal">
                                            ({equipmentOptions.find(opt => opt.value === calculatedMetrics.attackPotentialTuple.equipment)?.label.split(': ')[1] || 'Unknown'})
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 italic mt-2">
                                Values represent the critical (lowest AP) attack path through this subtree.
                            </div>
                        </div>
                    </div>
                )}
                {(isIntermediate || isRoot) && calculatedMetrics && !calculatedMetrics.hasSubtree && (
                    <div>
                        <Label>Calculated Attack Metrics</Label>
                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700/50 text-center">
                            <div className="text-sm text-gray-400">No attack paths available</div>
                            <div className="text-xs text-gray-500 mt-1">This node has no reachable attack leaves or all paths are blocked by TOE configurations.</div>
                        </div>
                    </div>
                )}
                {isLeaf && (
                    <div>
                        <Label htmlFor="attacker_type">Attacker Type</Label>
                        <Select
                            id="attacker_type"
                            value={selectedAttackerType}
                            onChange={(e) => handleAttackerTypeChange(e.target.value as AttackerType)}
                            disabled={isReadOnly}
                        >
                            {Object.values(AttackerType).map(type => <option key={type} value={type}>{type}</option>)}
                        </Select>
                    </div>
                )}
                {isLeaf && (
                    <div>
                        <Label>Attack Potential (AP)</Label>
                        <div className="space-y-3 p-3 bg-gray-800/50 rounded-md border border-gray-700/50">
                            <div>
                                <Label htmlFor="potential-time"><span className="capitalize">Time</span></Label>
                                <Select id="potential-time" value={need.attackPotential?.time || 0} onChange={e => handlePotentialChange('time', e.target.value)} disabled={isReadOnly}>
                                    {timeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="potential-expertise"><span className="capitalize">Expertise</span></Label>
                                <Select id="potential-expertise" value={need.attackPotential?.expertise || 0} onChange={e => handlePotentialChange('expertise', e.target.value)} disabled={isReadOnly || isPreset}>
                                    {expertiseOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="potential-knowledge"><span className="capitalize">Knowledge</span></Label>
                                <Select id="potential-knowledge" value={need.attackPotential?.knowledge || 0} onChange={e => handlePotentialChange('knowledge', e.target.value)} disabled={isReadOnly || isPreset}>
                                    {knowledgeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="potential-access"><span className="capitalize">Access</span></Label>
                                <Select id="potential-access" value={need.attackPotential?.access || 0} onChange={e => handlePotentialChange('access', e.target.value)} disabled={isReadOnly}>
                                    {accessOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="potential-equipment"><span className="capitalize">Equipment</span></Label>
                                <Select id="potential-equipment" value={need.attackPotential?.equipment || 0} onChange={e => handlePotentialChange('equipment', e.target.value)} disabled={isReadOnly || isPreset}>
                                    {equipmentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>
                        </div>
                    </div>
                )}
                {isIntermediate && (
                    <div>
                        <MultiSelectDropdown
                            label="TOE Configuration Items"
                            options={(project.toeConfigurations || []).map(c => ({ id: c.id, name: c.name }))}
                            selected={need.toeConfigurationIds || []}
                            onUpdate={handleToeConfigChange}
                            disabled={isReadOnly}
                        />
                    </div>
                )}
                <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input id="tags" type="text" value={need.tags.join(', ')} onChange={handleTagsChange} disabled={isReadOnly} />
                </div>
                <div>
                    <Label htmlFor="links">Links</Label>
                    <div className="text-sm text-gray-300 p-2 bg-gray-700/50 rounded">
                        {need.links.length > 0 ? need.links.join(', ') : 'No links'}
                    </div>
                </div>
            </div>
        </aside>
    );
};