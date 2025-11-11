
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NeedStatus, NeedType, Project, SphinxNeed } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface TechnicalAttackTreesViewProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    isReadOnly: boolean;
}

export const TechnicalAttackTreesView: React.FC<TechnicalAttackTreesViewProps> = ({ project, onUpdateProject, isReadOnly }) => {
    const { t } = useTranslation();

    const technicalTreeRoots = useMemo(() =>
        project.needs.filter(n => n.tags?.includes('technical-root')),
        [project.needs]);

    const addHistoryEntry = (proj: Project, message: string): Project => {
        const newHistory = [...(proj.history || []), `${new Date().toLocaleString()}: ${message}`];
        return { ...proj, history: newHistory };
    };

    const handleCreateTree = () => {
        if (isReadOnly) return;

        const existingIds = new Set(project.needs.map(n => n.id));
        let i = 1;
        let newId;
        do {
            newId = `TAT_${String(i).padStart(3, '0')}`;
            i++;
        } while (existingIds.has(newId));

        const newRoot: SphinxNeed = {
            id: newId,
            type: NeedType.ATTACK,
            title: t('newTechnicalAttackTree'),
            description: t('technicalAttackTreeDescription'),
            status: NeedStatus.OPEN,
            tags: ['technical-root'],
            links: [],
            logic_gate: 'OR',
            position: { x: 50, y: 50 }
        };

        const updatedNeeds = [...project.needs, newRoot];
        const updatedProject = addHistoryEntry({ ...project, needs: updatedNeeds }, `Created Technical Attack Tree root ${newId}.`);
        onUpdateProject(updatedProject);
    };

    const handleDeleteTree = (rootId: string) => {
        if (isReadOnly) return;

        const rootToDelete = project.needs.find(n => n.id === rootId);
        if (!rootToDelete) return;

        // Check if this technical tree is referenced by other nodes
        const referencingNodes = project.needs.filter(n => n.links?.includes(rootId));
        if (referencingNodes.length > 0) {
            const referencingIds = referencingNodes.map(n => n.id).join(', ');
            alert(t('cannotDeleteReferencedTechnicalTree', { rootId, referencingIds }));
            return;
        }

        // Check if this root has children
        if (rootToDelete.links && rootToDelete.links.length > 0) {
            alert(t('cannotDeleteTechnicalTreeWithChildren', { rootId }));
            return;
        }

        if (window.confirm(t('confirmDeleteTechnicalTree', { rootId }))) {
            const updatedNeeds = project.needs.filter(n => n.id !== rootId);
            const updatedProject = addHistoryEntry({ ...project, needs: updatedNeeds }, `Deleted Technical Attack Tree root ${rootId}.`);
            onUpdateProject(updatedProject);
        }
    };

    const getReferencingNodes = (rootId: string): SphinxNeed[] => {
        return project.needs.filter(n => n.links?.includes(rootId) && n.id !== rootId);
    };

    return (
        <div className="p-8 text-vscode-text-primary h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-vscode-text-primary">{t('technicalAttackTrees')}</h2>
                <button
                    onClick={handleCreateTree}
                    disabled={isReadOnly}
                    className="flex items-center gap-2 px-4 py-2 bg-vscode-accent text-white rounded-md hover:bg-vscode-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('addTechnicalAttackTree')}
                >
                    <PlusIcon className="w-4 h-4" />
                    {t('createTechnicalTree')}
                </button>
            </div>

            <p className="mb-6 text-vscode-text-secondary">
                {t('technicalAttackTreesInfo')}
            </p>

            <div className="flex-1 overflow-y-auto bg-vscode-bg-sidebar border border-vscode-border rounded-lg">
                {technicalTreeRoots.length === 0 ? (
                    <div className="p-8 text-center text-vscode-text-secondary">
                        <p className="mb-4">{t('noTechnicalTreesFound')}</p>
                        <p className="text-sm">{t('createTechnicalTreePrompt')}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="sticky top-0 bg-vscode-bg-sidebar backdrop-blur-sm">
                            <tr>
                                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary w-1/6">{t('treeId')}</th>
                                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary w-1/4">{t('treeTitle')}</th>
                                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary w-1/3">{t('description')}</th>
                                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary w-1/6">{t('referencedBy')}</th>
                                <th className="p-3 font-semibold tracking-wider text-vscode-text-primary text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {technicalTreeRoots.map((root) => {
                                const referencingNodes = getReferencingNodes(root.id);
                                return (
                                    <tr key={root.id} className="border-t border-vscode-border hover:bg-vscode-bg-hover transition-colors">
                                        <td className="p-3">
                                            <code className="text-xs bg-vscode-bg-input px-2 py-1 rounded">{root.id}</code>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium text-vscode-text-primary">{root.title}</div>
                                        </td>
                                        <td className="p-3 text-vscode-text-secondary">
                                            <div className="line-clamp-2">{root.description}</div>
                                        </td>
                                        <td className="p-3">
                                            {referencingNodes.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {referencingNodes.slice(0, 3).map(node => (
                                                        <code key={node.id} className="text-xs bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">
                                                            {node.id}
                                                        </code>
                                                    ))}
                                                    {referencingNodes.length > 3 && (
                                                        <span className="text-xs text-vscode-text-secondary">
                                                            +{referencingNodes.length - 3} {t('more')}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-vscode-text-secondary italic">{t('notReferenced')}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleDeleteTree(root.id)}
                                                    disabled={isReadOnly}
                                                    className="p-1.5 text-vscode-text-secondary hover:text-red-500 hover:bg-vscode-bg-hover rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={t('deleteTechnicalTree')}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-4 p-4 bg-vscode-bg-input border border-vscode-border rounded-lg">
                <h3 className="text-sm font-semibold mb-2 text-vscode-text-primary">{t('technicalTreesTips')}</h3>
                <ul className="text-xs text-vscode-text-secondary space-y-1">
                    <li>• {t('technicalTreeTip1')}</li>
                    <li>• {t('technicalTreeTip2')}</li>
                    <li>• {t('technicalTreeTip3')}</li>
                    <li>• {t('technicalTreeTip4')}</li>
                </ul>
            </div>
        </div>
    );
};
