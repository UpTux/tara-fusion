import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateDreadScore,
  createDefaultDreadRating,
  dreadFactorDescriptions,
  getDreadFactorColor,
  getDreadRiskLevel,
  getDreadScoreColor,
  getStrideCategoryColor,
  getStrideCategoryLetter,
  strideCategoryDescriptions,
  suggestMitigations,
} from '../services/strideDreadService';
import { generateStrideThreatsForProject, generateQuickThreat } from '../services/strideThreatGenerator';
import { getRiskColor } from '../services/riskService';
import { Asset, DreadRating, Project, StrideCategory, StrideThreat } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { PlusIcon } from './icons/PlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './modals/ConfirmationModal';

interface StrideThreatsViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  isReadOnly: boolean;
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode; className?: string }> = ({ htmlFor, children, className }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-vscode-text-secondary mb-1 ${className || ''}`}>{children}</label>
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

// DREAD Slider Component
const DreadSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  description?: string;
}> = ({ label, value, onChange, disabled, description }) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs capitalize">{label}</Label>
        <span className={`text-sm font-bold ${getDreadFactorColor(value)}`}>{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        className="w-full h-2 bg-vscode-bg-input rounded-lg appearance-none cursor-pointer accent-vscode-accent disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {description && (
        <p className="text-[10px] text-vscode-text-secondary">{description}</p>
      )}
    </div>
  );
};

// Category Filter Dropdown
const CategoryFilter: React.FC<{
  selectedCategories: StrideCategory[];
  onUpdate: (categories: StrideCategory[]) => void;
}> = ({ selectedCategories, onUpdate }) => {
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
  }, []);

  const handleToggle = (category: StrideCategory) => {
    if (selectedCategories.includes(category)) {
      onUpdate(selectedCategories.filter(c => c !== category));
    } else {
      onUpdate([...selectedCategories, category]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-1.5 bg-vscode-bg-input border border-vscode-border rounded-md text-xs"
      >
        <span>Filter: {selectedCategories.length === 0 ? 'All' : `${selectedCategories.length} selected`}</span>
        <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-10 right-0 mt-1 w-56 bg-vscode-bg-sidebar border border-vscode-border rounded-md shadow-lg">
          {Object.values(StrideCategory).map(category => (
            <label key={category} className="flex items-center px-3 py-2 text-xs hover:bg-vscode-bg-hover cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleToggle(category)}
                className="h-3 w-3 rounded border-vscode-border bg-vscode-bg-input text-vscode-accent focus:ring-vscode-accent"
              />
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${getStrideCategoryColor(category)}`}>
                {getStrideCategoryLetter(category)}
              </span>
              <span className="ml-2">{category}</span>
            </label>
          ))}
          {selectedCategories.length > 0 && (
            <button
              onClick={() => onUpdate([])}
              className="w-full px-3 py-2 text-xs text-vscode-text-secondary hover:bg-vscode-bg-hover border-t border-vscode-border"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const StrideThreatsView: React.FC<StrideThreatsViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [threats, setThreats] = useState<StrideThreat[]>(project.strideThreats || []);
  const [selectedId, setSelectedId] = useState<string | null>(threats[0]?.id || null);
  const [editorState, setEditorState] = useState<StrideThreat | null>(null);
  const [filterCategories, setFilterCategories] = useState<StrideCategory[]>([]);
  const [showMitigationSuggestions, setShowMitigationSuggestions] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const assetsById = useMemo(() =>
    (project.assets || []).reduce((acc, asset) => {
      acc[asset.id] = asset;
      return acc;
    }, {} as Record<string, Asset>),
    [project.assets]);

  // Sync state with project changes
  useEffect(() => {
    const currentThreats = project.strideThreats || [];
    setThreats(currentThreats);
    if (!selectedId && currentThreats.length > 0) {
      setSelectedId(currentThreats[0].id);
    }
    if (selectedId && !currentThreats.some(t => t.id === selectedId)) {
      setSelectedId(currentThreats[0]?.id || null);
    }
  }, [project.strideThreats, selectedId]);

  useEffect(() => {
    const selected = threats.find(t => t.id === selectedId);
    setEditorState(selected ? { ...selected } : null);
  }, [selectedId, threats]);

  // Filter threats by selected categories
  const filteredThreats = useMemo(() => {
    if (filterCategories.length === 0) return threats;
    return threats.filter(t => filterCategories.includes(t.strideCategory));
  }, [threats, filterCategories]);

  // Calculate threat with DREAD score for list display
  const threatsWithScore = useMemo(() => {
    return filteredThreats.map(t => ({
      ...t,
      dreadScore: calculateDreadScore(t.dpiaDreadRating),
      riskLevel: getDreadRiskLevel(calculateDreadScore(t.dpiaDreadRating)),
    }));
  }, [filteredThreats]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleUpdate = (field: keyof StrideThreat, value: unknown) => {
    if (isReadOnly || !editorState) return;
    setEditorState(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleBlur = (field: keyof StrideThreat) => {
    if (isReadOnly || !editorState) return;

    const originalThreat = threats.find(t => t.id === editorState.id);
    if (!originalThreat || JSON.stringify(originalThreat[field]) === JSON.stringify(editorState[field])) {
      return;
    }

    const updatedThreats = threats.map(t => t.id === editorState.id ? editorState : t);
    const updatedProject = addHistoryEntry({ ...project, strideThreats: updatedThreats }, `Updated ${field} for STRIDE Threat ${editorState.id}.`);
    onUpdateProject(updatedProject);
  };

  const handleDreadChange = (factor: keyof DreadRating, value: number) => {
    if (isReadOnly || !editorState) return;

    const newRating = { ...editorState.dpiaDreadRating, [factor]: value };
    const updatedEditorState = { ...editorState, dpiaDreadRating: newRating };
    setEditorState(updatedEditorState);

    const updatedThreats = threats.map(t => t.id === editorState.id ? updatedEditorState : t);
    const updatedProject = addHistoryEntry({ ...project, strideThreats: updatedThreats }, `Updated DREAD ${factor} for Threat ${editorState.id}.`);
    onUpdateProject(updatedProject);
  };

  const handleAddThreat = () => {
    if (isReadOnly) return;

    const existingIds = new Set(threats.map(t => t.id));
    let counter = threats.length + 1;
    let newId = `ST_${String(counter).padStart(3, '0')}`;
    while (existingIds.has(newId)) {
      counter++;
      newId = `ST_${String(counter).padStart(3, '0')}`;
    }

    const newThreat: StrideThreat = {
      id: newId,
      name: 'New STRIDE Threat',
      description: '',
      strideCategory: StrideCategory.SPOOFING,
      assetId: project.assets?.[0]?.id || '',
      affectedComponent: '',
      threatAgent: '',
      attackVector: '',
      dpiaDreadRating: createDefaultDreadRating(),
      mitigations: [],
      status: 'Identified',
      comment: '',
    };

    const updatedThreats = [...threats, newThreat];
    const updatedProject = addHistoryEntry({ ...project, strideThreats: updatedThreats }, `Added new STRIDE Threat ${newId}.`);
    onUpdateProject(updatedProject);
    setSelectedId(newId);
  };

  const handleAutoGenerate = () => {
    if (isReadOnly || !project.assets || project.assets.length === 0) return;

    const generatedThreats = generateStrideThreatsForProject(project.assets, threats);
    if (generatedThreats.length === 0) {
      return;
    }

    const updatedThreats = [...threats, ...generatedThreats];
    const updatedProject = addHistoryEntry(
      { ...project, strideThreats: updatedThreats },
      `Auto-generated ${generatedThreats.length} STRIDE threats from assets.`
    );
    onUpdateProject(updatedProject);
  };

  const handleDelete = () => {
    if (isReadOnly || !selectedId) return;

    setConfirmationModal({
      isOpen: true,
      title: 'Delete STRIDE Threat',
      message: `Are you sure you want to delete STRIDE Threat ${selectedId}?`,
      onConfirm: () => {
        const updatedThreats = threats.filter(t => t.id !== selectedId);
        const updatedProject = addHistoryEntry({ ...project, strideThreats: updatedThreats }, `Deleted STRIDE Threat ${selectedId}.`);
        onUpdateProject(updatedProject);
        setSelectedId(updatedThreats[0]?.id || null);
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddMitigation = () => {
    if (isReadOnly || !editorState) return;

    const newMitigations = [...editorState.mitigations, ''];
    handleUpdate('mitigations', newMitigations);
  };

  const handleMitigationChange = (index: number, value: string) => {
    if (isReadOnly || !editorState) return;

    const newMitigations = [...editorState.mitigations];
    newMitigations[index] = value;
    setEditorState(prev => prev ? { ...prev, mitigations: newMitigations } : null);
  };

  const handleMitigationBlur = () => {
    if (isReadOnly || !editorState) return;
    handleBlur('mitigations');
  };

  const handleRemoveMitigation = (index: number) => {
    if (isReadOnly || !editorState) return;

    const newMitigations = editorState.mitigations.filter((_, i) => i !== index);
    const updatedEditorState = { ...editorState, mitigations: newMitigations };
    setEditorState(updatedEditorState);

    const updatedThreats = threats.map(t => t.id === editorState.id ? updatedEditorState : t);
    const updatedProject = addHistoryEntry({ ...project, strideThreats: updatedThreats }, `Removed mitigation from Threat ${editorState.id}.`);
    onUpdateProject(updatedProject);
  };

  const handleAddSuggestedMitigation = (mitigation: string) => {
    if (isReadOnly || !editorState) return;

    if (editorState.mitigations.includes(mitigation)) return;

    const newMitigations = [...editorState.mitigations, mitigation];
    const updatedEditorState = { ...editorState, mitigations: newMitigations };
    setEditorState(updatedEditorState);

    const updatedThreats = threats.map(t => t.id === editorState.id ? updatedEditorState : t);
    const updatedProject = addHistoryEntry({ ...project, strideThreats: updatedThreats }, `Added suggested mitigation to Threat ${editorState.id}.`);
    onUpdateProject(updatedProject);
  };

  const dreadScore = editorState ? calculateDreadScore(editorState.dpiaDreadRating) : 0;
  const riskLevel = editorState ? getDreadRiskLevel(dreadScore) : null;
  const suggestedMitigations = editorState ? suggestMitigations(editorState.strideCategory) : [];

  return (
    <div className="flex h-full text-vscode-text-primary">
      {/* Threats List */}
      <div className="w-2/5 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-vscode-text-primary">STRIDE Threats</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddThreat}
              disabled={isReadOnly}
              className="flex items-center px-3 py-1.5 bg-vscode-accent text-white rounded-md text-xs font-medium hover:bg-vscode-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add
            </button>
            <button
              onClick={handleAutoGenerate}
              disabled={isReadOnly || !project.assets?.length}
              className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-600/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Auto-generate threats from assets"
            >
              <SparklesIcon className="w-4 h-4 mr-1" />
              Auto-Generate
            </button>
            <CategoryFilter
              selectedCategories={filterCategories}
              onUpdate={setFilterCategories}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-vscode-bg-sidebar">
              <tr>
                <th className="p-3 font-semibold text-vscode-text-primary">ID</th>
                <th className="p-3 font-semibold text-vscode-text-primary">Category</th>
                <th className="p-3 font-semibold text-vscode-text-primary">Name</th>
                <th className="p-3 font-semibold text-vscode-text-primary text-right">DREAD</th>
              </tr>
            </thead>
            <tbody>
              {threatsWithScore.map(threat => (
                <tr
                  key={threat.id}
                  onClick={() => setSelectedId(threat.id)}
                  className={`border-t border-vscode-border cursor-pointer transition-colors ${selectedId === threat.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}
                >
                  <td className="p-3 font-mono text-indigo-400">{threat.id}</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStrideCategoryColor(threat.strideCategory)}`}>
                      {getStrideCategoryLetter(threat.strideCategory)}
                    </span>
                  </td>
                  <td className="p-3 text-vscode-text-primary truncate max-w-[200px]" title={threat.name}>
                    {threat.name}
                  </td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDreadScoreColor(threat.dreadScore)}`}>
                      {threat.dreadScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {threatsWithScore.length === 0 && (
            <div className="p-8 text-center text-vscode-text-secondary">
              <p>No STRIDE threats defined yet.</p>
              <p className="text-xs mt-2">Click "Add" to create a new threat or "Auto-Generate" to create threats from assets.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="w-3/5 flex-1 overflow-y-auto p-8">
        {editorState ? (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-vscode-text-primary">{editorState.id}</h2>
                <div className="flex items-center mt-2 space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${getStrideCategoryColor(editorState.strideCategory)}`}>
                    {editorState.strideCategory}
                  </span>
                  {riskLevel && (
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${getRiskColor(riskLevel)}`}>
                      Risk: {riskLevel}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleDelete}
                disabled={isReadOnly}
                className="flex items-center px-3 py-2 bg-red-800/50 text-red-300 rounded-md text-sm font-medium hover:bg-red-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Label htmlFor="threatName">Threat Name</Label>
                <Input
                  id="threatName"
                  type="text"
                  value={editorState.name}
                  onChange={(e) => handleUpdate('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="strideCategory">STRIDE Category</Label>
                <Select
                  id="strideCategory"
                  value={editorState.strideCategory}
                  onChange={(e) => {
                    handleUpdate('strideCategory', e.target.value as StrideCategory);
                    handleBlur('strideCategory');
                  }}
                  disabled={isReadOnly}
                >
                  {Object.values(StrideCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
                <p className="text-[10px] text-vscode-text-secondary mt-1">
                  {strideCategoryDescriptions[editorState.strideCategory]?.description}
                </p>
              </div>

              <div>
                <Label htmlFor="assetId">Affected Asset</Label>
                <Select
                  id="assetId"
                  value={editorState.assetId}
                  onChange={(e) => {
                    handleUpdate('assetId', e.target.value);
                    handleBlur('assetId');
                  }}
                  disabled={isReadOnly}
                >
                  <option value="">-- Select Asset --</option>
                  {(project.assets || []).map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="affectedComponent">Affected Component</Label>
                <Input
                  id="affectedComponent"
                  type="text"
                  value={editorState.affectedComponent}
                  onChange={(e) => handleUpdate('affectedComponent', e.target.value)}
                  onBlur={() => handleBlur('affectedComponent')}
                  disabled={isReadOnly}
                  placeholder="e.g., Authentication Module"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={editorState.status}
                  onChange={(e) => {
                    handleUpdate('status', e.target.value);
                    handleBlur('status');
                  }}
                  disabled={isReadOnly}
                >
                  <option value="Identified">Identified</option>
                  <option value="In Analysis">In Analysis</option>
                  <option value="Mitigated">Mitigated</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Transferred">Transferred</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="threatAgent">Threat Agent</Label>
                <Input
                  id="threatAgent"
                  type="text"
                  value={editorState.threatAgent}
                  onChange={(e) => handleUpdate('threatAgent', e.target.value)}
                  onBlur={() => handleBlur('threatAgent')}
                  disabled={isReadOnly}
                  placeholder="e.g., External attacker, Malicious insider"
                />
              </div>

              <div>
                <Label htmlFor="attackVector">Attack Vector</Label>
                <Input
                  id="attackVector"
                  type="text"
                  value={editorState.attackVector}
                  onChange={(e) => handleUpdate('attackVector', e.target.value)}
                  onBlur={() => handleBlur('attackVector')}
                  disabled={isReadOnly}
                  placeholder="e.g., Network, API, Physical access"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={editorState.description}
                  onChange={(e) => handleUpdate('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  disabled={isReadOnly}
                  placeholder="Describe the threat scenario in detail..."
                />
              </div>
            </div>

            {/* DREAD Rating Section */}
            <div className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-vscode-text-primary">DREAD Risk Rating</h3>
                  <div className="relative group ml-2">
                    <InformationCircleIcon className="w-5 h-5 text-vscode-text-secondary cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 w-80 hidden group-hover:block bg-vscode-bg-sidebar border border-vscode-border text-vscode-text-primary text-xs rounded-lg p-3 z-20 shadow-lg">
                      <h4 className="font-bold mb-2">DREAD Risk Rating</h4>
                      <p className="mb-2">Rate each factor from 1 (low) to 10 (high):</p>
                      <ul className="space-y-1">
                        <li><strong>D</strong>amage: How much damage could occur?</li>
                        <li><strong>R</strong>eproducibility: How easy to reproduce?</li>
                        <li><strong>E</strong>xploitability: How easy to exploit?</li>
                        <li><strong>A</strong>ffected Users: How many affected?</li>
                        <li><strong>D</strong>iscoverability: How easy to discover?</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-vscode-text-secondary">Score:</span>
                  <span className={`px-3 py-1 rounded-md text-lg font-bold ${getDreadScoreColor(dreadScore)}`}>
                    {dreadScore}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {(Object.keys(dreadFactorDescriptions) as (keyof DreadRating)[]).map(factor => (
                  <DreadSlider
                    key={factor}
                    label={dreadFactorDescriptions[factor].name.split(' ')[0]}
                    value={editorState.dpiaDreadRating[factor]}
                    onChange={(value) => handleDreadChange(factor, value)}
                    disabled={isReadOnly}
                  />
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-vscode-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-vscode-text-secondary">Risk Level:</span>
                  {riskLevel && (
                    <span className={`px-3 py-1 rounded-md font-semibold text-white ${getRiskColor(riskLevel)}`}>
                      {riskLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mitigations Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Mitigations</Label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowMitigationSuggestions(!showMitigationSuggestions)}
                    className="text-xs text-vscode-text-secondary hover:text-vscode-text-primary flex items-center"
                  >
                    <SparklesIcon className="w-4 h-4 mr-1" />
                    {showMitigationSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                  </button>
                  <button
                    onClick={handleAddMitigation}
                    disabled={isReadOnly}
                    className="flex items-center px-2 py-1 bg-vscode-accent/20 text-vscode-accent rounded text-xs hover:bg-vscode-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
              </div>

              {showMitigationSuggestions && suggestedMitigations.length > 0 && (
                <div className="mb-4 p-3 bg-purple-600/10 border border-purple-500/30 rounded-md">
                  <p className="text-xs text-purple-300 mb-2">Suggested mitigations for {editorState.strideCategory}:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedMitigations.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAddSuggestedMitigation(suggestion)}
                        disabled={isReadOnly || editorState.mitigations.includes(suggestion)}
                        className="px-2 py-1 text-xs bg-purple-600/20 text-purple-300 rounded hover:bg-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {editorState.mitigations.map((mitigation, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={mitigation}
                      onChange={(e) => handleMitigationChange(index, e.target.value)}
                      onBlur={handleMitigationBlur}
                      disabled={isReadOnly}
                      placeholder="Describe mitigation strategy..."
                    />
                    <button
                      onClick={() => handleRemoveMitigation(index)}
                      disabled={isReadOnly}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-800/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {editorState.mitigations.length === 0 && (
                  <p className="text-sm text-vscode-text-secondary italic">No mitigations defined yet.</p>
                )}
              </div>
            </div>

            {/* Comment Section */}
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                rows={4}
                value={editorState.comment}
                onChange={(e) => handleUpdate('comment', e.target.value)}
                onBlur={() => handleBlur('comment')}
                disabled={isReadOnly}
                placeholder="Additional notes or observations..."
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary">
            <div className="text-center">
              <h3 className="text-lg mb-2">No STRIDE Threat Selected</h3>
              <p>Select a threat from the list or create a new one.</p>
              <p className="text-sm mt-4">
                Use the <strong>STRIDE</strong> methodology to categorize threats:
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-left max-w-md mx-auto">
                {Object.values(StrideCategory).map(cat => (
                  <div key={cat} className="flex items-center text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-bold mr-2 ${getStrideCategoryColor(cat)}`}>
                      {getStrideCategoryLetter(cat)}
                    </span>
                    <span>{cat}</span>
                  </div>
                ))}
              </div>
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
