
import React, { useMemo } from 'react';
import { NeedStatus, NeedType, Project, SecurityControl, SphinxNeed } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface CircumventTreesViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  isReadOnly: boolean;
}

export const CircumventTreesView: React.FC<CircumventTreesViewProps> = ({ project, onUpdateProject, isReadOnly }) => {

  const circumventTreeRoots = useMemo(() =>
    project.needs.filter(n => n.tags?.includes('circumvent-root')),
    [project.needs]);

  const rootsByControlId = useMemo(() => {
    const map = new Map<string, SphinxNeed>();
    circumventTreeRoots.forEach(root => {
      if (root.securityControlId) {
        map.set(root.securityControlId, root);
      }
    });
    return map;
  }, [circumventTreeRoots]);

  const addHistoryEntry = (proj: Project, message: string): Project => {
    const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
    return { ...proj, history: newHistory };
  };

  const handleCreateTree = (sc: SecurityControl) => {
    if (isReadOnly) return;

    const existingIds = new Set(project.needs.map(n => n.id));
    let i = 1;
    let newId;
    do {
      newId = `CT_${String(i).padStart(3, '0')}`;
      i++;
    } while (existingIds.has(newId));

    const newRoot: SphinxNeed = {
      id: newId,
      type: NeedType.ATTACK,
      title: `Circumvent ${sc.name}`,
      description: `Models the actions required to circumvent the security control: ${sc.name} (${sc.id})`,
      status: NeedStatus.OPEN,
      tags: ['circumvent-root'],
      links: [],
      securityControlId: sc.id,
      logic_gate: 'OR',
      position: { x: 50, y: 50 }
    };

    const updatedNeeds = [...project.needs, newRoot];
    const updatedProject = addHistoryEntry({ ...project, needs: updatedNeeds }, `Created Circumvent Tree root ${newId} for Security Control ${sc.id}.`);
    onUpdateProject(updatedProject);
  };

  const handleDeleteTree = (rootId: string) => {
    if (isReadOnly) return;

    const rootToDelete = project.needs.find(n => n.id === rootId);
    if (!rootToDelete) return;

    if (rootToDelete.links && rootToDelete.links.length > 0) {
      alert('Cannot delete a Circumvent Tree root that has children. Please go to the Attack Tree Editor and remove the links from this node first.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the Circumvent Tree root ${rootId}? This will also unlink it from any parent nodes.`)) {
      const updatedNeeds = project.needs
        .filter(n => n.id !== rootId)
        .map(n => ({
          ...n,
          links: (n.links || []).filter(linkId => linkId !== rootId)
        }));

      const updatedProject = addHistoryEntry({ ...project, needs: updatedNeeds }, `Deleted Circumvent Tree root ${rootId}.`);
      onUpdateProject(updatedProject);
    }
  };

  return (
    <div className="p-8 text-white h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-vscode-text-primary">Circumvent Trees</h2>
      <p className="mb-6 text-vscode-text-secondary">
        A Circumvent Tree models the actions required to bypass an active security control. Create a tree for each relevant security control to analyze residual risk. Trees can be edited in the Attack Tree Editor.
      </p>

      <div className="flex-1 overflow-y-auto bg-vscode-bg-sidebar border border-vscode-border rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
            <tr>
              <th className="p-3 font-semibold tracking-wider w-1/4">Security Control ID</th>
              <th className="p-3 font-semibold tracking-wider w-1/3">Security Control Name</th>
              <th className="p-3 font-semibold tracking-wider w-1/4">Circumvent Tree Status</th>
              <th className="p-3 font-semibold tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vscode-border">
            {(project.securityControls || []).map(sc => {
              const root = rootsByControlId.get(sc.id);
              return (
                <tr key={sc.id} className="hover:bg-vscode-bg-hover transition-colors">
                  <td className="p-3 font-mono text-vscode-text-secondary">{sc.id}</td>
                  <td className="p-3 font-medium">{sc.name}</td>
                  <td className="p-3">
                    {root ? (
                      <span className="font-mono text-teal-400" title={`Root Node ID: ${root.id}`}>
                        Tree Exists ({root.id})
                      </span>
                    ) : (
                      <span className="text-vscode-text-secondary italic">Not Created</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {root ? (
                      <button
                        onClick={() => handleDeleteTree(root.id)}
                        disabled={isReadOnly}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-800/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Delete Circumvent Tree ${root.id}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCreateTree(sc)}
                        disabled={isReadOnly}
                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-800/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Create Circumvent Tree for ${sc.name}`}
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {(project.securityControls || []).length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-8 text-vscode-text-secondary">
                  No security controls found. Please define security controls first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
