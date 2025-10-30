import React, { useEffect, useMemo, useState } from 'react';
import { accessOptions, equipmentOptions, expertiseOptions, knowledgeOptions, timeOptions } from '../services/feasibilityOptions';
import { calculateAP, getAttackFeasibilityRating, getFeasibilityRatingColor } from '../services/riskService';
import { importFromThreatCatalogXml } from '../services/threatCatalogService';
import { AttackPotentialTuple, NeedStatus, NeedType, Project, SphinxNeed } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UploadIcon } from './icons/UploadIcon';

interface AttackLeavesViewProps {
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
  <textarea {...props} rows={4} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white disabled:bg-gray-800/50 disabled:cursor-not-allowed" />
);

export const AttackLeavesView: React.FC<AttackLeavesViewProps> = ({ project, onUpdateProject, isReadOnly }) => {

  const attackLeaves = useMemo(() => {
    return project.needs
      .filter(need =>
        need.type === NeedType.ATTACK &&
        !need.logic_gate &&
        need.tags.includes('leaf') &&
        need.attackPotential
      )
      .map(leaf => {
        const ap = leaf.attackPotential ? calculateAP(leaf.attackPotential) : 0;
        const rating = getAttackFeasibilityRating(ap);
        return { ...leaf, ap, rating };
      })
      .sort((a, b) => a.id.localeCompare(b.id)); // Sort by ID
  }, [project.needs]);

  const [selectedId, setSelectedId] = useState<string | null>(attackLeaves[0]?.id || null);
  const [editorState, setEditorState] = useState<SphinxNeed | null>(null);

  const linkingNodes = useMemo(() => {
    if (!selectedId) return [];
    return project.needs.filter(n => n.links?.includes(selectedId));
  }, [selectedId, project.needs]);

  useEffect(() => {
    if ((!selectedId && attackLeaves.length > 0) || (selectedId && !attackLeaves.some(l => l.id === selectedId))) {
      setSelectedId(attackLeaves[0]?.id || null);
    }
  }, [attackLeaves, selectedId]);

  useEffect(() => {
    const selectedLeaf = project.needs.find(n => n.id === selectedId);
    setEditorState(selectedLeaf ? { ...selectedLeaf } : null);
  }, [selectedId, project.needs]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleCatalogImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const newLeaves = importFromThreatCatalogXml(content, project.needs);

        if (newLeaves.length > 0) {
          const updatedNeeds = [...project.needs, ...newLeaves];
          const updatedProject = addHistoryEntry({ ...project, needs: updatedNeeds }, `Imported ${newLeaves.length} attack leaves from threat catalog.`);
          onUpdateProject(updatedProject);
          alert(`Successfully imported ${newLeaves.length} new attack leaves.`);
        } else {
          alert("No new attack leaves found in the catalog to import. They may already exist in the project.");
        }
      } catch (error) {
        console.error('Failed to import threat catalog:', error);
        alert(`Failed to import threat catalog. ${error instanceof Error ? error.message : 'Please check the file format.'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleAddLeaf = () => {
    if (isReadOnly) return;

    const existingIds = new Set(project.needs.map(n => n.id));
    let i = 1;
    for (const id of existingIds) {
      // FIX: Add type guard to prevent calling string methods on unknown type.
      if (typeof id === 'string' && id.startsWith(`ATT_`)) {
        const num = parseInt(id.substring(4), 10);
        if (!isNaN(num) && num >= i) { i = num + 1; }
      }
    }
    let newId;
    do {
      newId = `ATT_${String(i).padStart(3, '0')}`;
      i++;
    } while (existingIds.has(newId));

    const newLeaf: SphinxNeed = {
      id: newId,
      type: NeedType.ATTACK,
      title: 'New Attack Leaf',
      description: '',
      status: NeedStatus.OPEN,
      tags: ['leaf'],
      links: [],
      attackPotential: { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 }
    };

    const updatedNeeds = [...project.needs, newLeaf];
    const updatedProject = addHistoryEntry({ ...project, needs: updatedNeeds }, `Created new Attack Leaf ${newId}.`);
    onUpdateProject(updatedProject);
    setSelectedId(newId);
  };

  const handleUpdate = (field: keyof SphinxNeed, value: any) => {
    if (isReadOnly || !editorState) return;

    const originalNeed = project.needs.find(n => n.id === editorState.id);
    // Do not save if value is unchanged
    if (originalNeed && JSON.stringify(originalNeed[field]) === JSON.stringify(value)) {
      return;
    }

    const updatedNeeds = project.needs.map(n => n.id === editorState.id ? { ...editorState, [field]: value } : n);
    const updatedProject = addHistoryEntry({ ...project, needs: updatedNeeds }, `Updated ${field} for Attack Leaf ${editorState.id}.`);
    onUpdateProject(updatedProject);
  };

  const handlePotentialChange = (field: keyof AttackPotentialTuple, value: string) => {
    if (isReadOnly || !editorState) return;
    const numericValue = parseInt(value, 10) || 0;
    const newPotential = {
      ...(editorState.attackPotential || { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 }),
      [field]: numericValue
    };
    // Update local state immediately for responsiveness
    setEditorState({ ...editorState, attackPotential: newPotential });
    // This will trigger the save with the updated potential
    handleUpdate('attackPotential', newPotential);
  };

  const handleDelete = () => {
    if (isReadOnly || !selectedId) return;

    if (window.confirm(`Are you sure you want to delete attack leaf ${selectedId}? This will remove it from all attack trees.`)) {
      const newNeeds: SphinxNeed[] = [];
      for (const need of project.needs) {
        // Skip the need that is being deleted
        if (need.id === selectedId) {
          continue;
        }

        // Check if the current need has links to the deleted need
        if (need.links && need.links.includes(selectedId)) {
          // If so, create a new need object with the link removed
          newNeeds.push({
            ...need,
            links: need.links.filter(linkId => linkId !== selectedId),
          });
        } else {
          // Otherwise, push the existing need object
          newNeeds.push(need);
        }
      }

      const updatedProject = addHistoryEntry({ ...project, needs: newNeeds }, `Deleted Attack Leaf ${selectedId}.`);
      onUpdateProject(updatedProject);
    }
  };

  return (
    <div className="flex h-full text-white">
      {/* Left Pane: Table */}
      <div className="w-2/5 border-r border-gray-700/50 flex flex-col">
        <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Attack Leaves</h2>
          <div className="flex items-center space-x-2">
            <label
              className={`p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title="Import Threat Catalog (XML)"
            >
              <UploadIcon className="w-5 h-5" />
              <input
                type="file"
                className="hidden"
                accept=".xml, text/xml"
                onChange={handleCatalogImport}
                disabled={isReadOnly}
              />
            </label>
            <button
              onClick={handleAddLeaf}
              disabled={isReadOnly}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add new attack leaf"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {attackLeaves.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 bg-gray-800/80 backdrop-blur-sm">
                <tr>
                  <th className="p-3 font-semibold tracking-wider">ID</th>
                  <th className="p-3 font-semibold tracking-wider">Title</th>
                  <th className="p-3 font-semibold tracking-wider text-center">AP</th>
                  <th className="p-3 font-semibold tracking-wider">AFR</th>
                </tr>
              </thead>
              <tbody>
                {attackLeaves.map(leaf => (
                  <tr
                    key={leaf.id}
                    onClick={() => setSelectedId(leaf.id)}
                    className={`border-t border-gray-700/50 cursor-pointer transition-colors ${selectedId === leaf.id ? 'bg-indigo-600/20' : 'hover:bg-gray-800/50'}`}
                  >
                    <td className="p-3 font-mono text-indigo-400">{leaf.id}</td>
                    <td className="p-3 truncate">{leaf.title}</td>
                    <td className="p-3 font-mono text-center">{leaf.ap}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getFeasibilityRatingColor(leaf.rating)}`}>
                        {leaf.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 p-4">
              <div className="text-center">
                <h3 className="text-lg">No Attack Leaves Found</h3>
                <p>Create attack trees and define leaf nodes to see them here.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Editor */}
      <div className="w-3/5 flex-1 overflow-y-auto p-8">
        {editorState ? (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-200">{editorState.id}: {editorState.title}</h2>
              <button
                onClick={handleDelete}
                disabled={isReadOnly}
                className="flex items-center px-3 py-2 bg-red-800/50 text-red-300 rounded-md text-sm font-medium hover:bg-red-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Delete ${editorState.id}`}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
            <div>
              <Label htmlFor="leafTitle">Title</Label>
              <Input id="leafTitle" type="text" value={editorState.title} onChange={(e) => setEditorState({ ...editorState, title: e.target.value })} onBlur={(e) => handleUpdate('title', e.target.value)} disabled={isReadOnly} />
            </div>
            <div>
              <Label htmlFor="leafDescription">Description</Label>
              <Textarea id="leafDescription" value={editorState.description} onChange={(e) => setEditorState({ ...editorState, description: e.target.value })} onBlur={(e) => handleUpdate('description', e.target.value)} disabled={isReadOnly} />
            </div>
            <div>
              <Label>Attack Potential (AP)</Label>
              <div className="space-y-3 p-3 bg-gray-800/50 rounded-md border border-gray-700/50">
                <div>
                  <Label htmlFor="potential-time"><span className="capitalize">Time</span></Label>
                  <Select id="potential-time" value={editorState.attackPotential?.time || 0} onChange={e => handlePotentialChange('time', e.target.value)} disabled={isReadOnly}>
                    {timeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="potential-expertise"><span className="capitalize">Expertise</span></Label>
                  <Select id="potential-expertise" value={editorState.attackPotential?.expertise || 0} onChange={e => handlePotentialChange('expertise', e.target.value)} disabled={isReadOnly}>
                    {expertiseOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="potential-knowledge"><span className="capitalize">Knowledge</span></Label>
                  <Select id="potential-knowledge" value={editorState.attackPotential?.knowledge || 0} onChange={e => handlePotentialChange('knowledge', e.target.value)} disabled={isReadOnly}>
                    {knowledgeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="potential-access"><span className="capitalize">Access</span></Label>
                  <Select id="potential-access" value={editorState.attackPotential?.access || 0} onChange={e => handlePotentialChange('access', e.target.value)} disabled={isReadOnly}>
                    {accessOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="potential-equipment"><span className="capitalize">Equipment</span></Label>
                  <Select id="potential-equipment" value={editorState.attackPotential?.equipment || 0} onChange={e => handlePotentialChange('equipment', e.target.value)} disabled={isReadOnly}>
                    {equipmentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <Label>Linked By ({linkingNodes.length})</Label>
              <div className="text-sm text-gray-300 p-2 bg-gray-900/50 rounded-md border border-gray-700/50 max-h-40 overflow-y-auto">
                {linkingNodes.length > 0 ? (
                  <ul className="space-y-1">
                    {linkingNodes.map(n => (
                      <li key={n.id} className="truncate">
                        <span className="font-mono text-indigo-400 mr-2">{n.id}</span>
                        <span className="text-gray-400">{n.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : <span className="text-gray-500 italic">Not linked by any nodes.</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <h3 className="text-lg">No Attack Leaf Selected</h3>
              <p>Select a leaf from the list to view and edit its details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};