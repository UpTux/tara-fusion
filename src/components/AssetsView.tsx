


import React, { useEffect, useRef, useState } from 'react';
import {
  convertEmb3dAssetsToTaraAssets,
  convertEmb3dThreatsToTaraThreats,
  getEmb3dAssets,
  type Emb3dAsset
} from '../services/emb3dService';
import { generateThreatName } from '../services/threatGenerator';
import { Asset, NeedStatus, NeedType, Project, SecurityProperty, SphinxNeed, Threat } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Emb3dAssetModal } from './modals/Emb3dAssetModal';

interface AssetsViewProps {
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

const MultiSelectDropdown: React.FC<{ options: string[], selected: string[], onUpdate: (selected: string[]) => void, label: string, disabled?: boolean }> = ({ options, selected, onUpdate, label, disabled = false }) => {
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

  const handleSelect = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
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
            <label key={option} className="flex items-center px-3 py-2 text-sm text-vscode-text-primary hover:bg-vscode-bg-hover cursor-pointer">
              <input type="checkbox" checked={selected.includes(option)} onChange={() => handleSelect(option)} className="h-4 w-4 rounded border-vscode-border bg-vscode-bg-input text-indigo-600 focus:ring-vscode-accent" />
              <span className="ml-3">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export const AssetsView: React.FC<AssetsViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
  const [assets, setAssets] = useState<Asset[]>(project.assets || []);
  const [selectedId, setSelectedId] = useState<string | null>(assets[0]?.id || null);
  const [editorState, setEditorState] = useState<Asset | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showEmb3dModal, setShowEmb3dModal] = useState(false);

  useEffect(() => {
    const currentAssets = project.assets || [];
    setAssets(currentAssets);
    if (!selectedId && currentAssets.length > 0) {
      setSelectedId(currentAssets[0].id)
    }
  }, [project.assets, selectedId]);

  useEffect(() => {
    const selected = assets.find(a => a.id === selectedId);
    setEditorState(selected ? { ...selected } : null);
  }, [selectedId, assets]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleAdd = () => {
    if (isReadOnly) return;
    const existingIds = new Set(assets.map(a => a.id));
    let i = 1;
    let newId = `ASSET_${String(i).padStart(3, '0')}`;
    while (existingIds.has(newId)) { i++; newId = `ASSET_${String(i).padStart(3, '0')}`; }

    const newAsset: Asset = {
      id: newId,
      name: 'New Asset',
      securityProperties: [],
      description: '',
      toeConfigurationIds: [],
      comment: ''
    };

    const updatedAssets = [...assets, newAsset];
    const updatedProject = addHistoryEntry({ ...project, assets: updatedAssets }, `Created Asset ${newId}.`);
    onUpdateProject(updatedProject);
    setSelectedId(newId);
  };

  const handleUpdate = (field: keyof Asset, value: any) => {
    if (isReadOnly || !editorState) return;
    setEditorState(prev => prev ? { ...prev, [field]: value } : null);

    const originalAsset = assets.find(a => a.id === editorState.id);
    if (!originalAsset || JSON.stringify(originalAsset[field]) === JSON.stringify(value)) {
      return;
    }

    if (field === 'securityProperties') {
      handleSecurityPropertiesUpdate(editorState.id, value, originalAsset.securityProperties);
    } else {
      const updatedAssets = assets.map(a => a.id === editorState.id ? { ...editorState, [field]: value } : a);
      const updatedProject = addHistoryEntry({ ...project, assets: updatedAssets }, `Updated ${field} for Asset ${editorState.id}.`);
      onUpdateProject(updatedProject);
    }
  };

  const handleSecurityPropertiesUpdate = (assetId: string, newProperties: SecurityProperty[], oldProperties: SecurityProperty[]) => {
    if (isReadOnly) return;
    const currentAsset = project.assets?.find(a => a.id === assetId);
    if (!currentAsset) return;

    const projectThreats = project.threats || [];
    const projectNeeds = project.needs || [];

    const addedProperties = newProperties.filter(p => !oldProperties.includes(p));
    const removedProperties = oldProperties.filter(p => !newProperties.includes(p));

    let updatedThreats = [...projectThreats];
    let updatedNeeds = [...projectNeeds];

    // Handle removals
    if (removedProperties.length > 0) {
      const idsToRemove = updatedThreats
        .filter(t => t.assetId === assetId && removedProperties.includes(t.securityProperty))
        .map(t => t.id);

      updatedThreats = updatedThreats.filter(t => !idsToRemove.includes(t.id));
      updatedNeeds = updatedNeeds.filter(n => !idsToRemove.includes(n.id));
    }

    // Handle additions
    if (addedProperties.length > 0) {
      const allThreatsAndNeedsIds = new Set([...updatedThreats.map(t => t.id), ...updatedNeeds.map(n => n.id)]);
      let counter = (project.threats?.length || 0) + 1;

      addedProperties.forEach(prop => {
        let newId = `THR_${String(counter).padStart(3, '0')}`;
        while (allThreatsAndNeedsIds.has(newId)) {
          counter++;
          newId = `THR_${String(counter).padStart(3, '0')}`;
        }
        allThreatsAndNeedsIds.add(newId);

        const threatName = generateThreatName(prop, currentAsset.name);

        const newThreat: Threat = {
          id: newId,
          name: threatName,
          assetId: assetId,
          securityProperty: prop,
          scales: false,
          // FIX: The property name is `initialAFR`, not `initialAFL`.
          initialAFR: 'TBD',
          // FIX: The property name is `residualAFR`, not `residualAFL`.
          residualAFR: 'TBD',
          reasoningScaling: '',
          comment: '',
          damageScenarioIds: []
        };
        updatedThreats.push(newThreat);

        const newNeed: SphinxNeed = {
          id: newId,
          type: NeedType.ATTACK,
          title: threatName,
          description: `Attack targeting the ${prop} of asset '${currentAsset.name}'.`,
          status: NeedStatus.OPEN,
          tags: ['threat', 'attack-root'],
          links: [],
          logic_gate: 'AND', // Attack tree roots are always AND nodes
          position: { x: Math.random() * 100, y: Math.random() * 800 }
        };
        updatedNeeds.push(newNeed);
      });
    }

    const updatedAssets = (project.assets || []).map(a => a.id === assetId ? { ...a, securityProperties: newProperties } : a);
    const historyMessage = `Updated security properties for asset ${assetId}. Added: ${addedProperties.join(', ') || 'None'}. Removed: ${removedProperties.join(', ') || 'None'}.`;

    onUpdateProject(addHistoryEntry({
      ...project,
      assets: updatedAssets,
      threats: updatedThreats,
      needs: updatedNeeds,
    }, historyMessage));
  };


  const handleCommentSave = () => {
    if (isReadOnly || !editorState) return;
    setSaveStatus('saving');

    const field: keyof Asset = 'comment';
    const value = editorState.comment;
    const updatedAssets = assets.map(a => a.id === editorState.id ? { ...editorState, [field]: value } : a);
    const updatedProject = addHistoryEntry({ ...project, assets: updatedAssets }, `Updated ${field} for Asset ${editorState.id}.`);
    onUpdateProject(updatedProject);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleDelete = () => {
    if (isReadOnly || !selectedId) return;
    if (window.confirm(`Are you sure you want to delete Asset ${selectedId}? Any related threats will also be removed.`)) {

      const updatedAssets = assets.filter(a => a.id !== selectedId);
      const threatsToRemove = (project.threats || []).filter(t => t.assetId === selectedId).map(t => t.id);
      const updatedThreats = (project.threats || []).filter(t => t.assetId !== selectedId);
      const updatedNeeds = (project.needs || []).filter(n => !threatsToRemove.includes(n.id));

      const updatedProject = addHistoryEntry({
        ...project,
        assets: updatedAssets,
        threats: updatedThreats,
        needs: updatedNeeds
      }, `Deleted Asset ${selectedId} and its ${threatsToRemove.length} associated threats.`);

      onUpdateProject(updatedProject);
      setSelectedId(updatedAssets[0]?.id || null);
    }
  };

  const handleEmb3dImport = (selectedEmb3dAssets: Emb3dAsset[]) => {
    if (isReadOnly) return;

    const existingAssets = project.assets || [];
    const convertedAssets = convertEmb3dAssetsToTaraAssets(selectedEmb3dAssets, existingAssets);

    const updatedAssets = [...(project.assets || []), ...convertedAssets];
    let updatedThreats = [...(project.threats || [])];
    const updatedNeeds = [...(project.needs || [])];

    let totalNewThreats = 0;

    // For each imported Emb3d asset, convert its threats from the catalog
    convertedAssets.forEach((asset, index) => {
      const emb3dAsset = selectedEmb3dAssets[index];

      // Convert Emb3d threats to TARA threats with proper traceability
      const newThreats = convertEmb3dThreatsToTaraThreats(
        emb3dAsset,
        asset.id,
        updatedThreats
      );

      totalNewThreats += newThreats.length;
      updatedThreats = [...updatedThreats, ...newThreats];

      // Create corresponding SphinxNeed objects for each threat
      newThreats.forEach(threat => {
        const newNeed: SphinxNeed = {
          id: threat.id,
          type: NeedType.ATTACK,
          title: threat.name,
          description: `Attack targeting the ${threat.securityProperty} of asset '${asset.name}'. Source: MITRE Emb3d threat ${threat.emb3dThreatId || 'unknown'}.`,
          status: NeedStatus.OPEN,
          tags: ['threat', 'attack-root', 'emb3d'],
          links: [],
          position: { x: Math.random() * 100, y: Math.random() * 800 }
        };
        updatedNeeds.push(newNeed);
      });
    });

    const historyMessage = `Imported ${convertedAssets.length} assets from MITRE Emb3d with ${totalNewThreats} associated threats from the Emb3d threat catalog.`;

    onUpdateProject(addHistoryEntry({
      ...project,
      assets: updatedAssets,
      threats: updatedThreats,
      needs: updatedNeeds,
    }, historyMessage));

    setShowEmb3dModal(false);
  };

  return (
    <div className="flex h-full text-vscode-text-primary">
      {/* Assets List */}
      <div className="w-1/3 border-r border-vscode-border flex flex-col">
        <div className="p-4 border-b border-vscode-border flex justify-between items-center">
          <h2 className="text-2xl font-bold text-vscode-text-primary">Assets</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEmb3dModal(true)}
              title="Import from MITRE Emb3d"
              className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isReadOnly}
            >
              <DatabaseIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleAdd}
              title="Add new asset"
              className="p-1.5 text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isReadOnly}
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
              <tr>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">ID</th>
                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-vscode-text-primary">Name</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr
                  key={asset.id}
                  onClick={() => setSelectedId(asset.id)}
                  className={`border-t border-vscode-border cursor-pointer transition-colors ${selectedId === asset.id ? 'bg-vscode-accent/20' : 'hover:bg-vscode-bg-hover'}`}
                >
                  <td className="p-3 font-mono text-indigo-400">{asset.id}</td>
                  <td className="p-3">{asset.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Editor */}
      <div className="w-2/3 flex-1 overflow-y-auto p-8">
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
                <Label htmlFor="assetId">ID</Label>
                <Input id="assetId" type="text" value={editorState.id} onBlur={e => handleUpdate('id', e.target.value)} onChange={e => setEditorState({ ...editorState, id: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <Label htmlFor="assetName">Name</Label>
                <Input id="assetName" type="text" value={editorState.name} onBlur={e => handleUpdate('name', e.target.value)} onChange={e => setEditorState({ ...editorState, name: e.target.value })} disabled={isReadOnly} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="assetDesc">Description</Label>
                <Textarea id="assetDesc" rows={3} value={editorState.description} onBlur={e => handleUpdate('description', e.target.value)} onChange={e => setEditorState({ ...editorState, description: e.target.value })} disabled={isReadOnly} />
              </div>
              <div>
                <MultiSelectDropdown
                  label="Security Properties"
                  options={Object.values(SecurityProperty)}
                  selected={editorState.securityProperties}
                  onUpdate={(selected) => handleUpdate('securityProperties', selected)}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <MultiSelectDropdown
                  label="TOE Configurations"
                  options={(project.toeConfigurations || []).map(c => c.id)}
                  selected={editorState.toeConfigurationIds}
                  onUpdate={(selected) => handleUpdate('toeConfigurationIds', selected)}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="assetComment">Comment (RST)</Label>
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
              <Textarea id="assetComment" rows={10} value={editorState.comment} onChange={e => setEditorState({ ...editorState, comment: e.target.value })} disabled={isReadOnly} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-vscode-text-secondary">
            <div className="text-center">
              <h3 className="text-lg">No Asset Selected</h3>
              <p>Select an asset from the list or create a new one.</p>
            </div>
          </div>
        )}
      </div>

      {/* MITRE Emb3d Import Modal */}
      {showEmb3dModal && (
        <Emb3dAssetModal
          availableAssets={getEmb3dAssets()}
          onConfirm={handleEmb3dImport}
          onClose={() => setShowEmb3dModal(false)}
        />
      )}
    </div>
  );
};
