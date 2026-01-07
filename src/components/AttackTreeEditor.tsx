import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Connection,
    Controls,
    Edge,
    EdgeChange,
    Handle,
    MarkerType,
    Node,
    NodeChange,
    Position,
    ReactFlowProvider,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    useReactFlow,
} from 'reactflow';
import { calculateAttackTreeMetrics, calculateNodeMetrics, detectCycle, findCircumventTreeRoot, findTechnicalTreeRoot, hasCircumventTrees, isNodeInCircumventSubtree, isNodeInTechnicalSubtree, traceCriticalPaths } from '../services/attackTreeService';
import { accessOptions, equipmentOptions, expertiseOptions, knowledgeOptions, timeOptions } from '../services/feasibilityOptions';
import { getAttackFeasibilityRating, getFeasibilityRatingColor } from '../services/riskService';
import { AttackFeasibilityRating, AttackPotentialTuple, NeedStatus, NeedType, Project, SphinxNeed } from '../types';
import { PropertiesPanel } from './PropertiesPanel';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { ClockIcon } from './icons/ClockIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { KeyIcon } from './icons/KeyIcon';
import { LinkBreakIcon } from './icons/LinkBreakIcon';
import { TrashIcon } from './icons/TrashIcon';
import { WrenchIcon } from './icons/WrenchIcon';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { ErrorModal } from './modals/ErrorModal';

interface AttackTreeEditorProps {
    project: Project;
    onUpdateNeeds: (needs: SphinxNeed[], historyMessage: string) => void;
    onUpdateNeed: (need: SphinxNeed) => void;
    onSelectNeed: (need: SphinxNeed | null) => void;
    isReadOnly: boolean;
}
const getNodeColor = (need: SphinxNeed, afr?: AttackFeasibilityRating, residualAfr?: AttackFeasibilityRating): string => {
    if (need.type !== NeedType.ATTACK) {
        return 'bg-vscode-bg-input border-vscode-border';
    }
    if (need.tags.includes('circumvent-root')) {
        return 'bg-teal-700 border-teal-500';
    }
    if (need.tags.includes('technical-root')) {
        return 'bg-purple-700 border-purple-500';
    }

    const isRoot = need.tags.includes('attack-root');
    const isIntermediate = !!need.logic_gate && !isRoot;

    // For attack-root nodes, use AFR color
    if (isRoot) {
        // Use residual AFR if circumvent tree is linked, otherwise use regular AFR
        const targetAfr = residualAfr || afr;
        if (targetAfr) {
            // Map AFR to background and border colors
            switch (targetAfr) {
                case AttackFeasibilityRating.HIGH:
                    return 'bg-red-700 border-red-500';
                case AttackFeasibilityRating.MEDIUM:
                    return 'bg-orange-700 border-orange-500';
                case AttackFeasibilityRating.LOW:
                    return 'bg-yellow-700 border-yellow-500';
                case AttackFeasibilityRating.VERY_LOW:
                    return 'bg-green-700 border-green-500';
                default:
                    return 'bg-gray-700 border-gray-500';
            }
        }
        // Fallback to default red if no AFR available
        return 'bg-red-800 border-red-500';
    }

    if (isIntermediate) {
        return 'bg-blue-600 border-blue-400';
    }

    return 'bg-red-800 border-red-500';
};


const apConfig: { [key in keyof AttackPotentialTuple]: { icon: React.FC<{ className?: string; title?: string }>, options: { value: number, label: string }[] } } = {
    time: { icon: ClockIcon, options: timeOptions },
    expertise: { icon: AcademicCapIcon, options: expertiseOptions },
    knowledge: { icon: DocumentTextIcon, options: knowledgeOptions },
    access: { icon: KeyIcon, options: accessOptions },
    equipment: { icon: WrenchIcon, options: equipmentOptions },
};

const ApEditor: React.FC<{ potential?: AttackPotentialTuple, onUpdate: (field: keyof AttackPotentialTuple, value: string) => void, isReadOnly: boolean }> = ({ potential, onUpdate, isReadOnly }) => {
    if (!potential) return null;
    // FIX: Explicitly cast `val` to Number to prevent type error when summing.
    const totalAp = Object.values(potential).reduce((sum: number, val) => sum + Number(val || 0), 0);

    return (
        <div className="mt-2 pt-2 border-t border-vscode-border-light nodrag">
            <div className="flex justify-between items-center text-xs font-mono text-vscode-text-primary mb-2">
                <span>AP Total:</span>
                <span className="font-bold text-vscode-accent">{totalAp}</span>
            </div>
            <div className="space-y-1.5">
                {(Object.keys(potential) as Array<keyof AttackPotentialTuple>).map(key => {
                    const { icon: Icon, options } = apConfig[key];
                    return (
                        <div key={key} className="flex items-center space-x-2 text-xs">
                            <Icon className="w-4 h-4 text-vscode-text-secondary flex-shrink-0" title={key.charAt(0).toUpperCase() + key.slice(1)} />
                            <select
                                value={potential[key] || 0}
                                onChange={(e) => onUpdate(key, e.target.value)}
                                className="w-full bg-vscode-bg-input text-vscode-text-primary text-xs rounded-sm border border-transparent focus:border-vscode-accent focus:ring-0 py-0.5 disabled:bg-vscode-bg-input/50 disabled:cursor-not-allowed"
                                onClick={(e) => e.stopPropagation()}
                                disabled={isReadOnly}
                            >
                                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CustomNode: React.FC<{
    data: SphinxNeed,
    selected: boolean,
    isCritical: boolean,
    onUpdateNeed: (need: SphinxNeed) => void,
    isReadOnly: boolean,
    project: Project,
    layoutDirection: LayoutDirection,
    draggable?: boolean,
    isCircumventTreeNode?: boolean,
    isTechnicalTreeNode?: boolean,
    onToggleCollapse?: (circumventRootId: string) => void,
    onUnlinkCircumventTree?: (circumventRootId: string) => void,
    isCollapsed?: boolean,
    showCollapseButton?: boolean,
    onDeleteRequest?: (nodeId: string) => void,
    onUnlinkRequest?: (nodeId: string) => void
}> = ({ data, selected, isCritical, onUpdateNeed, isReadOnly, project, layoutDirection, draggable = true, isCircumventTreeNode = false, isTechnicalTreeNode = false, onToggleCollapse, onUnlinkCircumventTree, isCollapsed = false, showCollapseButton = false, onDeleteRequest, onUnlinkRequest }) => {
    const isCircumventRoot = data.tags.includes('circumvent-root');
    const isTechnicalRoot = data.tags.includes('technical-root');
    const isAttackRoot = data.tags.includes('attack-root');
    const isRoot = isAttackRoot || isCircumventRoot || isTechnicalRoot;
    const isLeaf = data.type === NeedType.ATTACK && !data.logic_gate && !isRoot;
    const isIntermediate = data.type === NeedType.ATTACK && !isLeaf && !isRoot;

    // Properties are read-only if viewing a circumvent tree node or technical tree node in attack tree view, or if globally read-only
    const propertiesReadOnly = isCircumventTreeNode || isTechnicalTreeNode || isReadOnly;

    // Circumvent tree roots and technical tree roots need target handle when shown in attack tree view (isCircumventTreeNode/isTechnicalTreeNode = true)
    // but not when viewing the circumvent/technical tree itself (isCircumventTreeNode/isTechnicalTreeNode = false)
    const showTargetHandle = !isAttackRoot && (!isCircumventRoot || isCircumventTreeNode) && (!isTechnicalRoot || isTechnicalTreeNode);

    const handlePotentialChange = (field: keyof AttackPotentialTuple, value: string) => {
        if (propertiesReadOnly) return;
        const numericValue = Math.max(0, parseInt(value, 10) || 0);
        const newPotential = {
            ...(data.attackPotential || { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 }),
            [field]: numericValue
        };
        onUpdateNeed({ ...data, attackPotential: newPotential });
    };

    // Calculate metrics for intermediate and root nodes
    const calculatedMetrics = useMemo(() => {
        if (isIntermediate || isRoot) {
            // For circumvent tree roots or technical tree roots, we need to include their own subtree
            const isCircumventRoot = data.tags.includes('circumvent-root');
            const isTechnicalRoot = data.tags.includes('technical-root');

            // Check if this node (intermediate or root) is part of a circumvent tree
            const isPartOfCircumventTree = isCircumventRoot || isNodeInCircumventSubtree(data.id, project.needs);

            // For attack-root: calculate initial AFR WITHOUT circumvent trees (includeCircumventTrees = false)
            // For circumvent-root, technical-root, or nodes inside circumvent trees: include circumvent trees (includeCircumventTrees = true)
            // For intermediate nodes in attack trees: don't include circumvent trees (includeCircumventTrees = false)
            const includeCircumventTrees = isPartOfCircumventTree || isTechnicalRoot;

            return calculateNodeMetrics(data.id, project.needs, project.toeConfigurations, includeCircumventTrees);
        }
        return null;
    }, [data.id, project.needs, project.toeConfigurations, isIntermediate, isRoot, data.tags]);

    // For attack-root nodes, also calculate residual metrics if circumvent trees exist
    const residualMetrics = useMemo(() => {
        if (isRoot && data.tags.includes('attack-root')) {
            const hasCircumvent = hasCircumventTrees(data.id, project.needs);
            if (hasCircumvent) {
                return calculateNodeMetrics(data.id, project.needs, project.toeConfigurations, true);
            }
        }
        return null;
    }, [data.id, data.tags, project.needs, project.toeConfigurations, isRoot]);

    // Determine handle positions based on layout direction
    const targetPosition = layoutDirection === 'TB' ? Position.Top : Position.Left;
    const sourcePosition = layoutDirection === 'TB' ? Position.Bottom : Position.Right;

    // Get AFR for color calculation
    const afr = calculatedMetrics ? getAttackFeasibilityRating(calculatedMetrics.attackPotential) : undefined;
    const residualAfr = residualMetrics ? getAttackFeasibilityRating(residualMetrics.attackPotential) : undefined;

    return (
        <>
            {showTargetHandle && (
                <Handle
                    type="target"
                    position={targetPosition}
                    id="target"
                    className={`!w-3 !h-3 border-2 transition-colors ${isCritical ? '!bg-red-400 !border-red-200' : '!bg-vscode-bg-input !border-vscode-accent'}`}
                />
            )}
            <div className={`
                ${getNodeColor(data, afr, residualAfr)}
                rounded-lg p-3 w-64 text-vscode-text-primary shadow-xl
                border-2 transition-all relative cursor-pointer
                ${selected ? 'ring-4 ring-offset-2 ring-offset-vscode-bg-main ring-vscode-accent' : ''}
                ${isLeaf ? 'border-dashed' : ''}
                ${isCritical ? 'border-red-400 shadow-red-500/30' : ''}
                ${isCircumventTreeNode ? 'opacity-80' : ''}
            `}>
                {isCircumventTreeNode && (
                    <div className="absolute -top-2 -left-2 bg-gray-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" title="Properties read-only (circumvent tree node)">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
                {isCircumventRoot && showCollapseButton && onToggleCollapse && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCollapse(data.id);
                        }}
                        className="absolute -top-2 -left-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors nodrag"
                        title={isCollapsed ? "Expand circumvent tree" : "Collapse circumvent tree"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {isCollapsed ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            )}
                        </svg>
                    </button>
                )}
                {isCircumventRoot && showCollapseButton && onUnlinkCircumventTree && !isReadOnly && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onUnlinkRequest) {
                                onUnlinkRequest(data.id);
                            }
                        }}
                        className="absolute -top-2 -right-10 bg-orange-600 hover:bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors nodrag"
                        title="Unlink circumvent tree from attack tree"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.596a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </button>
                )}
                {isCritical && <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
                {data.logic_gate && (
                    <div className="absolute -top-3 -right-3 bg-vscode-bg-sidebar border-2 border-vscode-accent rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs text-vscode-accent">
                        {data.logic_gate}
                    </div>
                )}
                <div className="font-bold text-sm truncate">{data.id}</div>
                <div className="text-xs text-vscode-text-primary uppercase font-mono tracking-wider mb-2">{data.type}</div>
                <div className="text-sm mb-2">{data.title}</div>

                {/* Calculated metrics for intermediate and root nodes */}
                {(isIntermediate || isRoot) && calculatedMetrics && calculatedMetrics.hasSubtree && (
                    <div className="mt-2 pt-2 border-t border-vscode-border-light nodrag">
                        {/* Initial metrics (or only metrics for intermediate nodes) */}
                        <div className={residualMetrics ? 'mb-2 pb-2 border-b border-vscode-border-light' : ''}>
                            {residualMetrics && (
                                <div className="text-xs text-vscode-text-secondary font-semibold mb-1">Initial (no controls)</div>
                            )}
                            <div className="flex items-center justify-between text-xs mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="text-vscode-text-secondary">AP:</span>
                                    <span className="font-bold font-mono text-vscode-accent">
                                        {calculatedMetrics.attackPotential === Infinity ? '∞' : calculatedMetrics.attackPotential}
                                    </span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getFeasibilityRatingColor(getAttackFeasibilityRating(calculatedMetrics.attackPotential))}`}>
                                    {getAttackFeasibilityRating(calculatedMetrics.attackPotential)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <div className="text-center" title="Time">
                                    <div className="text-vscode-text-secondary text-xs">T</div>
                                    <div className="font-mono text-vscode-text-primary">{calculatedMetrics.attackPotentialTuple.time}</div>
                                </div>
                                <div className="text-center" title="Expertise">
                                    <div className="text-vscode-text-secondary text-xs">E</div>
                                    <div className="font-mono text-vscode-text-primary">{calculatedMetrics.attackPotentialTuple.expertise}</div>
                                </div>
                                <div className="text-center" title="Knowledge">
                                    <div className="text-vscode-text-secondary text-xs">K</div>
                                    <div className="font-mono text-vscode-text-primary">{calculatedMetrics.attackPotentialTuple.knowledge}</div>
                                </div>
                                <div className="text-center" title="Access">
                                    <div className="text-vscode-text-secondary text-xs">A</div>
                                    <div className="font-mono text-vscode-text-primary">{calculatedMetrics.attackPotentialTuple.access}</div>
                                </div>
                                <div className="text-center" title="Equipment">
                                    <div className="text-vscode-text-secondary text-xs">Eq</div>
                                    <div className="font-mono text-vscode-text-primary">{calculatedMetrics.attackPotentialTuple.equipment}</div>
                                </div>
                            </div>
                        </div>

                        {/* Residual metrics (only for attack-root nodes with circumvent trees) */}
                        {residualMetrics && residualMetrics.hasSubtree && (
                            <div>
                                <div className="text-xs text-vscode-text-secondary font-semibold mb-1">Residual (with controls)</div>
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-vscode-text-secondary">AP:</span>
                                        <span className="font-bold font-mono text-green-400">
                                            {residualMetrics.attackPotential === Infinity ? '∞' : residualMetrics.attackPotential}
                                        </span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getFeasibilityRatingColor(getAttackFeasibilityRating(residualMetrics.attackPotential))}`}>
                                        {getAttackFeasibilityRating(residualMetrics.attackPotential)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <div className="text-center" title="Time">
                                        <div className="text-vscode-text-secondary text-xs">T</div>
                                        <div className="font-mono text-vscode-text-primary">{residualMetrics.attackPotentialTuple.time}</div>
                                    </div>
                                    <div className="text-center" title="Expertise">
                                        <div className="text-vscode-text-secondary text-xs">E</div>
                                        <div className="font-mono text-vscode-text-primary">{residualMetrics.attackPotentialTuple.expertise}</div>
                                    </div>
                                    <div className="text-center" title="Knowledge">
                                        <div className="text-vscode-text-secondary text-xs">K</div>
                                        <div className="font-mono text-vscode-text-primary">{residualMetrics.attackPotentialTuple.knowledge}</div>
                                    </div>
                                    <div className="text-center" title="Access">
                                        <div className="text-vscode-text-secondary text-xs">A</div>
                                        <div className="font-mono text-vscode-text-primary">{residualMetrics.attackPotentialTuple.access}</div>
                                    </div>
                                    <div className="text-center" title="Equipment">
                                        <div className="text-vscode-text-secondary text-xs">Eq</div>
                                        <div className="font-mono text-vscode-text-primary">{residualMetrics.attackPotentialTuple.equipment}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No paths message for nodes without subtrees */}
                {(isIntermediate || isRoot) && calculatedMetrics && !calculatedMetrics.hasSubtree && (
                    <div className="mt-2 pt-2 border-t border-vscode-border-light text-center">
                        <div className="text-xs text-vscode-text-secondary">No attack paths</div>
                    </div>
                )}

                {isLeaf && <ApEditor potential={data.attackPotential} onUpdate={handlePotentialChange} isReadOnly={propertiesReadOnly} />}
            </div>
            <Handle
                type="source"
                position={sourcePosition}
                id="source"
                className={`!w-3 !h-3 border-2 transition-colors ${isCritical ? '!bg-red-400 !border-red-200' : '!bg-vscode-bg-input !border-vscode-accent'}`}
            />
        </>
    );
};

type LayoutDirection = 'TB' | 'LR'; // Top-to-Bottom or Left-to-Right

// Calculate the actual height of a node based on its content
const getNodeHeight = (need: SphinxNeed, allNeeds: SphinxNeed[], baseHeight: number): number => {
    const isAttackRoot = need.tags.includes('attack-root');
    const isCircumventRoot = need.tags.includes('circumvent-root');
    const isTechnicalRoot = need.tags.includes('technical-root');
    const isRoot = isAttackRoot || isCircumventRoot || isTechnicalRoot;
    const isLeaf = need.type === NeedType.ATTACK && !need.logic_gate && !isRoot;

    // Leaf nodes have ApEditor with 5 dropdowns + total display
    // ApEditor adds approximately 180px to the height
    // (border-top + AP Total line + 5 dropdown rows with spacing)
    if (isLeaf) {
        return baseHeight + 180;
    }

    // Check if this attack-root has circumvent trees (which adds residual metrics section)
    if (isAttackRoot && hasCircumventTrees(need.id, allNeeds)) {
        // Residual metrics section adds approximately 120px to the height
        // (heading + attack potential + feasibility rating + tuple display)
        return baseHeight + 120;
    }

    return baseHeight;
};

const getLayoutedElements = (
    rootId: string,
    allNeeds: SphinxNeed[],
    options: { nodeWidth: number, nodeHeight: number, horizontalGap: number, verticalGap: number },
    direction: LayoutDirection = 'TB'
) => {
    const treeNodes = getTreeNodes(rootId, allNeeds);
    const needsMap = new Map(treeNodes.map(n => [n.id, n]));
    const treeNodeIds = new Set(treeNodes.map(n => n.id));

    // Calculate actual heights for each node
    const nodeHeights = new Map<string, number>();
    treeNodes.forEach(node => {
        nodeHeights.set(node.id, getNodeHeight(node, allNeeds, options.nodeHeight));
    });

    // 1. Assign ranks (level) using BFS.
    const ranks: Map<number, string[]> = new Map();
    const nodeRanks = new Map<string, number>();
    const queue: { id: string, rank: number }[] = [{ id: rootId, rank: 0 }];
    const visited = new Set<string>([rootId]);

    let maxRank = 0;

    while (queue.length > 0) {
        const item = queue.shift();
        if (!item) continue;
        const { id, rank } = item;
        nodeRanks.set(id, rank);

        if (!ranks.has(rank)) {
            ranks.set(rank, []);
        }
        const rankList = ranks.get(rank);
        if (rankList) {
            rankList.push(id);
        }
        maxRank = Math.max(maxRank, rank);

        const node = needsMap.get(id);
        if (node?.links) {
            for (const childId of node.links) {
                // Only process nodes within the current tree that haven't been visited
                if (treeNodeIds.has(childId) && !visited.has(childId)) {
                    visited.add(childId);
                    queue.push({ id: childId, rank: rank + 1 });
                }
            }
        }
    }

    // 2. Check for overlaps and adjust spacing if needed
    const { nodeWidth, nodeHeight } = options;

    const checkOverlap = (
        pos1: { x: number, y: number },
        pos2: { x: number, y: number },
        width: number,
        height1: number,
        height2: number
    ): boolean => {
        const avgHeight = (height1 + height2) / 2;
        return Math.abs(pos1.x - pos2.x) < width && Math.abs(pos1.y - pos2.y) < avgHeight;
    };

    const layoutWithSpacing = (hGap: number, vGap: number): Map<string, { x: number, y: number }> => {
        const positions = new Map<string, { x: number, y: number }>();

        if (direction === 'TB') {
            // Top-to-Bottom layout
            // Track cumulative Y position for each rank
            let cumulativeY = 0;

            for (let i = 0; i <= maxRank; i++) {
                const nodesInRank = ranks.get(i) || [];
                const rankWidth = nodesInRank.length * nodeWidth + Math.max(0, nodesInRank.length - 1) * hGap;
                let currentX = -rankWidth / 2;

                // Find the maximum height in this rank to determine spacing to next rank
                const maxHeightInRank = Math.max(...nodesInRank.map(id => nodeHeights.get(id) || nodeHeight));

                nodesInRank.forEach(nodeId => {
                    positions.set(nodeId, { x: currentX, y: cumulativeY });
                    currentX += nodeWidth + hGap;
                });

                // Move to next rank: add max height of current rank + vertical gap
                cumulativeY += maxHeightInRank + vGap;
            }
        } else {
            // Left-to-Right layout
            for (let i = 0; i <= maxRank; i++) {
                const nodesInRank = ranks.get(i) || [];

                // Calculate total height needed for this rank using actual node heights
                let totalRankHeight = 0;
                nodesInRank.forEach((nodeId, idx) => {
                    const height = nodeHeights.get(nodeId) || nodeHeight;
                    totalRankHeight += height;
                    if (idx < nodesInRank.length - 1) {
                        totalRankHeight += vGap;
                    }
                });

                let currentY = -totalRankHeight / 2;

                nodesInRank.forEach(nodeId => {
                    const height = nodeHeights.get(nodeId) || nodeHeight;
                    const x = i * (nodeWidth + hGap);
                    positions.set(nodeId, { x, y: currentY });
                    currentY += height + vGap;
                });
            }
        }

        return positions;
    };

    // Start with initial spacing and increase if overlaps detected
    let { horizontalGap, verticalGap } = options;
    let newPositions = layoutWithSpacing(horizontalGap, verticalGap);
    let hasOverlap = false;
    const maxIterations = 5; // Prevent infinite loop
    let iteration = 0;

    do {
        hasOverlap = false;
        const posArray = Array.from(newPositions.entries());

        // Check all pairs for overlap
        for (let i = 0; i < posArray.length && !hasOverlap; i++) {
            for (let j = i + 1; j < posArray.length; j++) {
                const [id1, pos1] = posArray[i];
                const [id2, pos2] = posArray[j];

                // Only check nodes in different ranks to avoid false positives
                if (nodeRanks.get(id1) !== nodeRanks.get(id2)) {
                    const height1 = nodeHeights.get(id1) || nodeHeight;
                    const height2 = nodeHeights.get(id2) || nodeHeight;
                    if (checkOverlap(pos1, pos2, nodeWidth, height1, height2)) {
                        hasOverlap = true;
                        break;
                    }
                }
            }
        }

        if (hasOverlap && iteration < maxIterations) {
            // Increase spacing by 30%
            horizontalGap = Math.floor(horizontalGap * 1.3);
            verticalGap = Math.floor(verticalGap * 1.3);
            newPositions = layoutWithSpacing(horizontalGap, verticalGap);
            iteration++;
        }
    } while (hasOverlap && iteration < maxIterations);

    // 3. Create the updated list of all needs.
    return allNeeds.map(need => {
        if (newPositions.has(need.id)) {
            const position = newPositions.get(need.id);
            return {
                ...need,
                position: position || need.position
            };
        }
        return need;
    });
};


const AttackTreeCanvas: React.FC<AttackTreeEditorProps & { selectedTreeRootId: string | null }> = ({
    project,
    onUpdateNeeds,
    onUpdateNeed,
    onSelectNeed,
    selectedTreeRootId,
    isReadOnly
}) => {
    const [nodes, setNodes] = useState<Node<SphinxNeed>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const { fitView } = useReactFlow();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [contextMenu, setContextMenu] = useState<{ top: number; left: number; node: Node<SphinxNeed>; } | null>(null);
    const [isLinkLeafSubMenuOpen, setIsLinkLeafSubMenuOpen] = useState(false);
    const [isLinkCTSubMenuOpen, setIsLinkCTSubMenuOpen] = useState(false);
    const [isLinkTTSubMenuOpen, setIsLinkTTSubMenuOpen] = useState(false);
    const [leafSearch, setLeafSearch] = useState('');
    const [ctSearch, setCtSearch] = useState('');
    const [ttSearch, setTtSearch] = useState('');
    const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('TB');
    const [collapsedCircumventTrees, setCollapsedCircumventTrees] = useState<Set<string>>(new Set());

    const [treeMetrics, setTreeMetrics] = useState<{
        attackPotential: number;
        afr: AttackFeasibilityRating;
        residualAttackPotential?: number;
        residualAfr?: AttackFeasibilityRating;
        hasCircumventTrees: boolean;
    } | null>(null);
    const [criticalNodeIds, setCriticalNodeIds] = useState<Set<string>>(new Set());
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; title: string; message: string; confirmLabel: string; isDangerous: boolean; onConfirm: () => void }>({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: '',
        isDangerous: false,
        onConfirm: () => { }
    });

    const allAttackLeaves = useMemo(() => {
        return project.needs.filter(n =>
            n.type === NeedType.ATTACK &&
            !n.logic_gate &&
            !n.tags.includes('attack-root') &&
            !n.tags.includes('circumvent-root') &&
            !n.tags.includes('technical-root')
        ).sort((a, b) => a.id.localeCompare(b.id));
    }, [project.needs]);

    const allCircumventTreeRoots = useMemo(() => {
        return project.needs.filter(n =>
            n.type === NeedType.ATTACK &&
            n.tags.includes('circumvent-root')
        ).sort((a, b) => a.id.localeCompare(b.id));
    }, [project.needs]);

    const allTechnicalTreeRoots = useMemo(() => {
        return project.needs.filter(n =>
            n.type === NeedType.ATTACK &&
            n.tags.includes('technical-root')
        ).sort((a, b) => a.id.localeCompare(b.id));
    }, [project.needs]);

    const filteredLeaves = useMemo(() => {
        if (!leafSearch) return allAttackLeaves;
        const searchTerm = leafSearch.toLowerCase();
        return allAttackLeaves.filter(leaf =>
            leaf.id.toLowerCase().includes(searchTerm) ||
            leaf.title.toLowerCase().includes(searchTerm)
        );
    }, [allAttackLeaves, leafSearch]);

    const filteredCTs = useMemo(() => {
        // Get the currently selected tree root to check if we're viewing a circumvent tree
        const selectedTreeRoot = project.needs.find(n => n.id === selectedTreeRootId);
        const isViewingCircumventTree = selectedTreeRoot?.tags.includes('circumvent-root');

        let trees = allCircumventTreeRoots;

        // If currently viewing a circumvent tree, exclude it from the list (prevent self-linking)
        if (isViewingCircumventTree && selectedTreeRootId) {
            trees = trees.filter(ct => ct.id !== selectedTreeRootId);
        }

        if (!ctSearch) return trees;
        const searchTerm = ctSearch.toLowerCase();
        return trees.filter(ct =>
            ct.id.toLowerCase().includes(searchTerm) ||
            ct.title.toLowerCase().includes(searchTerm)
        );
    }, [allCircumventTreeRoots, ctSearch, selectedTreeRootId, project.needs]);

    const filteredTTs = useMemo(() => {
        // Get the currently selected tree root to check if we're viewing a technical tree
        const selectedTreeRoot = project.needs.find(n => n.id === selectedTreeRootId);
        const isViewingTechnicalTree = selectedTreeRoot?.tags.includes('technical-root');

        let trees = allTechnicalTreeRoots;

        // If currently viewing a technical tree, exclude it from the list (prevent self-linking)
        if (isViewingTechnicalTree && selectedTreeRootId) {
            trees = trees.filter(tt => tt.id !== selectedTreeRootId);
        }

        if (!ttSearch) return trees;
        const searchTerm = ttSearch.toLowerCase();
        return trees.filter(tt =>
            tt.id.toLowerCase().includes(searchTerm) ||
            tt.title.toLowerCase().includes(searchTerm)
        );
    }, [allTechnicalTreeRoots, ttSearch, selectedTreeRootId, project.needs]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
        setIsLinkLeafSubMenuOpen(false);
        setIsLinkCTSubMenuOpen(false);
        setIsLinkTTSubMenuOpen(false);
        setLeafSearch('');
        setCtSearch('');
        setTtSearch('');
    }, []);

    useEffect(() => {
        if (selectedTreeRootId) {
            // Calculate initial AFR (without circumvent trees)
            const metrics = calculateAttackTreeMetrics(selectedTreeRootId, project.needs, project.toeConfigurations, false);

            // Check if there are any circumvent trees
            const hasCircumvent = hasCircumventTrees(selectedTreeRootId, project.needs);

            if (metrics) {
                const initialAfr = getAttackFeasibilityRating(metrics.attackPotential);

                // If there are circumvent trees, calculate residual AFR (with circumvent trees)
                if (hasCircumvent) {
                    const residualMetrics = calculateAttackTreeMetrics(selectedTreeRootId, project.needs, project.toeConfigurations, true);
                    if (residualMetrics) {
                        // eslint-disable-next-line react-hooks/set-state-in-effect
                        setTreeMetrics({
                            attackPotential: metrics.attackPotential,
                            afr: initialAfr,
                            residualAttackPotential: residualMetrics.attackPotential,
                            residualAfr: getAttackFeasibilityRating(residualMetrics.attackPotential),
                            hasCircumventTrees: true
                        });
                    } else {
                        setTreeMetrics({
                            attackPotential: metrics.attackPotential,
                            afr: initialAfr,
                            hasCircumventTrees: true
                        });
                    }
                } else {
                    setTreeMetrics({
                        attackPotential: metrics.attackPotential,
                        afr: initialAfr,
                        hasCircumventTrees: false
                    });
                }

                const allCriticalNodes = traceCriticalPaths(selectedTreeRootId, metrics.criticalPaths, project.needs);
                setCriticalNodeIds(allCriticalNodes);
            } else {
                setTreeMetrics(null);
                setCriticalNodeIds(new Set());
            }
        }
    }, [selectedTreeRootId, project.needs, project.toeConfigurations]);

    const handleToggleCollapse = useCallback((circumventRootId: string) => {
        setCollapsedCircumventTrees(prev => {
            const newSet = new Set(prev);
            if (newSet.has(circumventRootId)) {
                newSet.delete(circumventRootId);
            } else {
                newSet.add(circumventRootId);
            }
            return newSet;
        });
    }, []);

    const handleUnlinkCircumventTreeFromNode = useCallback((circumventTreeId: string) => {
        if (isReadOnly) return;

        const circumventTree = project.needs.find(n => n.id === circumventTreeId);
        if (!circumventTree || !circumventTree.tags.includes('circumvent-root')) {
            return;
        }

        // Find all parent nodes that link to this circumvent tree
        const parentNodes = project.needs.filter(need => need.links?.includes(circumventTreeId));

        if (parentNodes.length === 0) {
            return;
        }

        // Remove the link from all parent nodes
        const updatedNeeds = project.needs.map(need => {
            if (need.links?.includes(circumventTreeId)) {
                return { ...need, links: need.links.filter(link => link !== circumventTreeId) };
            }
            return need;
        });

        // Remove from collapsed set
        setCollapsedCircumventTrees(prev => {
            const newSet = new Set(prev);
            newSet.delete(circumventTreeId);
            return newSet;
        });

        onUpdateNeeds(updatedNeeds, `Unlinked circumvent tree '${circumventTreeId}' from attack tree. The tree is still available in the project.`);
        onUpdateNeeds(updatedNeeds, `Unlinked circumvent tree '${circumventTreeId}' from attack tree. The tree is still available in the project.`);
    }, [project.needs, onUpdateNeeds, isReadOnly, setCollapsedCircumventTrees]);

    const handleUnlinkRequest = useCallback((nodeId: string) => {
        setConfirmationModal({
            isOpen: true,
            title: 'Unlink Circumvent Tree',
            message: 'Unlink this circumvent tree from the attack tree?\n\nThe tree will remain in the project and can be re-linked later.',
            confirmLabel: 'Unlink',
            isDangerous: false,
            onConfirm: () => {
                handleUnlinkCircumventTreeFromNode(nodeId);
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }, [handleUnlinkCircumventTreeFromNode]);

    const handleDeleteNodeRequest = useCallback((nodeId: string) => {
        if (isReadOnly) return;

        // Check if node has children
        const node = project.needs.find(n => n.id === nodeId);
        const hasChildren = node?.links && node.links.length > 0;

        setConfirmationModal({
            isOpen: true,
            title: 'Delete Node',
            message: hasChildren
                ? `Are you sure you want to delete node ${nodeId}? It has connected children.`
                : `Are you sure you want to delete node ${nodeId}?`,
            confirmLabel: 'Delete',
            isDangerous: true,
            onConfirm: () => {
                // This logic needs to be implemented or passed down. 
                // Since deleteNode logic is inside onNodesDelete which is handled by ReactFlow,
                // we might need to trigger that or expose a delete function.
                // However, ReactFlow handles deletion via Backspace key usually.
                // If we want a button, we need to implement the deletion logic here.

                // Implementation similar to onNodesDelete but for a single node
                const needsToDelete = new Set([nodeId]);
                const updatedNeeds = project.needs.filter(need => !needsToDelete.has(need.id));

                // Also remove links to deleted nodes
                const cleanedNeeds = updatedNeeds.map(need => ({
                    ...need,
                    links: need.links?.filter(linkId => !needsToDelete.has(linkId)) || []
                }));

                onUpdateNeeds(cleanedNeeds, `Deleted node ${nodeId}`);
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }, [isReadOnly, project.needs, onUpdateNeeds]);

    const memoizedNodeTypes = useMemo(() => ({
        custom: (props: { data: SphinxNeed & { _isCircumventTreeNode?: boolean; _isTechnicalTreeNode?: boolean; _isCollapsed?: boolean; _showCollapseButton?: boolean }; selected: boolean; id: string; draggable?: boolean }) => (
            <CustomNode
                {...props}
                isCritical={criticalNodeIds.has(props.data.id)}
                onUpdateNeed={onUpdateNeed}
                isReadOnly={isReadOnly}
                project={project}
                layoutDirection={layoutDirection}
                draggable={props.draggable}
                isCircumventTreeNode={props.data._isCircumventTreeNode}
                isTechnicalTreeNode={props.data._isTechnicalTreeNode}
                onToggleCollapse={handleToggleCollapse}
                onUnlinkCircumventTree={handleUnlinkCircumventTreeFromNode}
                isCollapsed={props.data._isCollapsed}
                showCollapseButton={props.data._showCollapseButton}
                onUnlinkRequest={handleUnlinkRequest}
                onDeleteRequest={handleDeleteNodeRequest}
            />
        )
    }), [criticalNodeIds, onUpdateNeed, isReadOnly, project, layoutDirection, handleToggleCollapse, handleUnlinkCircumventTreeFromNode, handleUnlinkRequest, handleDeleteNodeRequest]);

    useEffect(() => {
        if (!selectedTreeRootId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setNodes([]);
             
            setEdges([]);
            return;
        }

        const allTreeNodes = getTreeNodes(selectedTreeRootId, project.needs);

        // Check if we're viewing a circumvent tree or technical tree
        const selectedTreeRoot = project.needs.find(n => n.id === selectedTreeRootId);
        const isViewingCircumventTree = selectedTreeRoot?.tags.includes('circumvent-root');
        const isViewingTechnicalTree = selectedTreeRoot?.tags.includes('technical-root');

        // Filter out nodes that are children of collapsed circumvent trees
        const visibleNeeds = allTreeNodes.filter(n => {
            if (n.type === NeedType.RISK || n.type === NeedType.MITIGATION) {
                return false;
            }

            // When viewing a circumvent tree or technical tree directly, show all nodes (don't apply collapse filtering)
            if (isViewingCircumventTree || isViewingTechnicalTree) {
                return true;
            }

            // Check if this node is a child of a collapsed circumvent tree
            // We need to check if any of its ancestor circumvent tree roots are collapsed
            if (collapsedCircumventTrees.size > 0) {
                // Find all circumvent tree roots that are ancestors of this node
                for (const collapsedRootId of collapsedCircumventTrees) {
                    // If this node is the collapsed root itself, keep it visible
                    if (n.id === collapsedRootId) {
                        continue;
                    }

                    // Check if this node is a descendant of the collapsed root
                    const collapsedRoot = project.needs.find(need => need.id === collapsedRootId);
                    if (collapsedRoot) {
                        const descendantsOfCollapsed = getTreeNodes(collapsedRootId, project.needs);
                        if (descendantsOfCollapsed.some(desc => desc.id === n.id && desc.id !== collapsedRootId)) {
                            return false; // Hide this node as it's a child of a collapsed tree
                        }
                    }
                }
            }

            return true;
        });

        const visibleNeedsMap = new Map(visibleNeeds.map(need => [need.id, need]));

        // Re-use the check from above
        const flowNodes: Node<SphinxNeed>[] = visibleNeeds.map(need => {
            // Determine if this node is part of a circumvent tree
            const nodeIsCircumventTreeNode = need.tags.includes('circumvent-root') || isNodeInCircumventSubtree(need.id, project.needs);
            // Determine if this node is part of a technical tree
            const nodeIsTechnicalTreeNode = need.tags.includes('technical-root') || isNodeInTechnicalSubtree(need.id, project.needs);

            // Properties are read-only when viewing a circumvent tree node or technical tree node in an attack tree
            const isCircumventPropertyReadOnly = !isViewingCircumventTree && nodeIsCircumventTreeNode;
            const isTechnicalPropertyReadOnly = !isViewingTechnicalTree && nodeIsTechnicalTreeNode;

            // Check if this circumvent root is collapsed
            const isCollapsed = need.tags.includes('circumvent-root') && collapsedCircumventTrees.has(need.id);

            // Show collapse button when viewing attack tree and node is a circumvent root
            const showCollapseButton = !isViewingCircumventTree && need.tags.includes('circumvent-root');

            return {
                id: need.id,
                type: 'custom',
                position: need.position || { x: Math.random() * 800, y: Math.random() * 600 },
                data: {
                    ...need,
                    // Add flag to data so it gets passed to CustomNode
                    _isCircumventTreeNode: isCircumventPropertyReadOnly,
                    _isTechnicalTreeNode: isTechnicalPropertyReadOnly,
                    _isCollapsed: isCollapsed,
                    _showCollapseButton: showCollapseButton,
                },
                draggable: true, // Always allow dragging
                connectable: !isCircumventPropertyReadOnly && !isTechnicalPropertyReadOnly, // Don't allow connections to/from circumvent/technical tree nodes in attack tree view
            };
        });

        const flowEdges: Edge[] = [];

        // Add regular edges (child connections)
        visibleNeeds.forEach(need => {
            (need.links || []).forEach(linkId => {
                if (visibleNeedsMap.has(linkId)) {
                    const isCritical = criticalNodeIds.has(need.id) && criticalNodeIds.has(linkId);
                    const targetNode = visibleNeedsMap.get(linkId);
                    const isCircumventTreeEdge = targetNode?.tags.includes('circumvent-root');
                    const isTechnicalTreeEdge = targetNode?.tags.includes('technical-root');

                    // Determine edge color: critical (red) > technical (purple) > circumvent (teal) > default (indigo)
                    let edgeColor = '#818cf8'; // default indigo
                    let edgeWidth = 2;

                    if (isCritical) {
                        edgeColor = '#f87171'; // red for critical paths
                        edgeWidth = 3;
                    } else if (isTechnicalTreeEdge) {
                        edgeColor = '#c084fc'; // purple for technical trees
                        edgeWidth = 2.5;
                    } else if (isCircumventTreeEdge) {
                        edgeColor = '#14b8a6'; // teal for circumvent trees
                        edgeWidth = 2.5;
                    }

                    flowEdges.push({
                        id: `${need.id}-${linkId}`,
                        source: need.id,
                        target: linkId,
                        type: 'smoothstep',
                        animated: isCritical,
                        style: {
                            stroke: edgeColor,
                            strokeWidth: edgeWidth,
                            strokeDasharray: isCircumventTreeEdge ? '5,5' : undefined
                        },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            width: 20,
                            height: 20,
                            color: isCritical ? '#f87171' : (isCircumventTreeEdge ? '#14b8a6' : '#818cf8'),
                        },
                    });
                }
            });
        });

        setNodes(flowNodes);
        setEdges(flowEdges);

        setTimeout(() => fitView({ duration: 300 }), 0);

    }, [selectedTreeRootId, project.needs, fitView, criticalNodeIds, collapsedCircumventTrees]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        if (isReadOnly) return;
        setNodes((nds) => applyNodeChanges(changes, nds));
    }, [setNodes, isReadOnly]);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        if (isReadOnly) return;
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, [setEdges, isReadOnly]);

    const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
        if (isReadOnly) return;
        const updatedNeeds = project.needs.map(need => {
            let linksChanged = false;
            const newLinks = (need.links || []).filter(link => {
                const isDeleted = edgesToDelete.some(edge => edge.source === need.id && edge.target === link);
                if (isDeleted) linksChanged = true;
                return !isDeleted;
            });
            return linksChanged ? { ...need, links: newLinks } : need;
        });
        const deletedLinksStr = edgesToDelete.map(e => `${e.source} -> ${e.target}`).join(', ');
        onUpdateNeeds(updatedNeeds, `Deleted link(s): ${deletedLinksStr}`);
    }, [project.needs, onUpdateNeeds, isReadOnly]);

    const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
        if (isReadOnly) return;
        const updatedNeeds = project.needs.map(n =>
            n.id === node.id ? { ...n, position: node.position } : n
        );
        onUpdateNeeds(updatedNeeds, `Moved node '${node.id}'.`);
    }, [project.needs, onUpdateNeeds, isReadOnly]);

    const onConnect = useCallback((params: Connection) => {
        if (isReadOnly || !params.source || !params.target) return;

        const sourceNeed = project.needs.find(n => n.id === params.source);
        const targetNeed = project.needs.find(n => n.id === params.target);

        if (!sourceNeed || !targetNeed) return;

        // Check for circular references
        if (detectCycle(params.source, params.target, project.needs)) {
            setErrorModal({
                isOpen: true,
                message: `Cannot connect '${params.source}' to '${params.target}' because it would create a circular reference.`
            });
            return;
        }

        if (targetNeed.type === NeedType.RISK || targetNeed.type === NeedType.MITIGATION) {
            setErrorModal({
                isOpen: true,
                message: 'Connection to RISK or MITIGATION nodes is not allowed in the attack tree view.'
            });
            return;
        }

        const isSourceRoot = sourceNeed.tags.includes('attack-root') || sourceNeed.tags.includes('circumvent-root');
        const isSourceLeaf = sourceNeed.type === NeedType.ATTACK && !sourceNeed.logic_gate && !isSourceRoot;
        if (isSourceLeaf) {
            setErrorModal({
                isOpen: true,
                message: 'Connection failed: An Attack Leaf cannot have outgoing connections.'
            });
            return;
        }

        /**
         * ISO/SAE 21434 Definition 4.9: Circumvent Tree Connection Enforcement
         * 
         * When connecting a circumvent tree to a parent node, the parent MUST have an AND gate.
         * This ensures that an attacker must perform BOTH:
         * 1. The original attack action (regular attack path)
         * 2. The circumvention of the security control (circumvent tree)
         * 
         * The code below automatically sets the parent's logic_gate to 'AND' when connecting
         * a circumvent tree, unless the parent is already an OR node with all children being
         * circumvent trees (edge case allowed by standard).
         */
        const isTargetCircumventTree = targetNeed.tags.includes('circumvent-root');

        if (isTargetCircumventTree) {
            // Check if parent already has an AND gate or needs one
            if (sourceNeed.logic_gate === 'OR') {
                const childLinks = [...(sourceNeed.links || []), params.target];
                const allChildrenAreCTs = childLinks.every(childId => {
                    const childNode = project.needs.find(n => n.id === childId);
                    return childNode?.tags.includes('circumvent-root');
                });
                if (!allChildrenAreCTs) {
                    setErrorModal({
                        isOpen: true,
                        message: 'A Circumvent Tree can only be a child of an OR node if all other children of that node are also Circumvent Trees.'
                    });
                    return;
                }
                // If all children are circumvent trees, keep OR gate
            } else if (!sourceNeed.logic_gate) {
                // No gate set yet, will be set to AND below
            } else if (sourceNeed.logic_gate !== 'AND') {
                setErrorModal({
                    isOpen: true,
                    message: 'A Circumvent Tree must be a child of an AND node (or an OR node if all siblings are also Circumvent Trees).'
                });
                return;
            }
        }

        setEdges((eds) => addEdge({
            ...params,
            type: 'smoothstep',
            style: { stroke: '#818cf8', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#818cf8' },
        }, eds));

        const updatedNeeds = [...project.needs];
        const sourceNeedIndex = updatedNeeds.findIndex(n => n.id === params.source);
        if (sourceNeedIndex !== -1) {
            const sourceNeedToUpdate = { ...updatedNeeds[sourceNeedIndex] };
            sourceNeedToUpdate.links = [...(sourceNeedToUpdate.links || []), params.target];

            // Per ISO/SAE 21434: Set parent to AND gate when connecting a circumvent tree
            // (unless all children are circumvent trees, in which case keep OR)
            if (isTargetCircumventTree && sourceNeedToUpdate.logic_gate !== 'OR') {
                sourceNeedToUpdate.logic_gate = 'AND';
            }

            updatedNeeds[sourceNeedIndex] = sourceNeedToUpdate;
            onUpdateNeeds(updatedNeeds, `Connected '${params.source}' to '${params.target}'.`);
        }

    }, [project.needs, onUpdateNeeds, setEdges, isReadOnly]);

    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node<SphinxNeed>) => {
        if (isReadOnly) return;
        event.preventDefault();

        // Check if we're viewing a circumvent tree or an attack tree
        const selectedTreeRoot = project.needs.find(n => n.id === selectedTreeRootId);
        const isViewingCircumventTree = selectedTreeRoot?.tags.includes('circumvent-root');

        // Prevent context menu on circumvent tree nodes when viewing an attack tree
        const nodeIsCircumventTreeNode = node.data.tags.includes('circumvent-root') || isNodeInCircumventSubtree(node.data.id, project.needs);
        if (!isViewingCircumventTree && nodeIsCircumventTreeNode) {
            return; // Don't show context menu for circumvent tree nodes in attack tree view
        }

        const pane = reactFlowWrapper.current?.getBoundingClientRect();
        if (!pane) return;

        setContextMenu({ top: event.clientY - pane.top, left: event.clientX - pane.left, node: node });
    }, [isReadOnly, project.needs, selectedTreeRootId]);

    const handleAddNode = useCallback((parentNode: Node<SphinxNeed>, type: 'intermediate' | 'leaf') => {
        if (isReadOnly) return;
        closeContextMenu();
        const newNodeId = generateUniqueNeedId('ATT', project.needs);
        const newNode: SphinxNeed = {
            id: newNodeId,
            type: NeedType.ATTACK,
            title: type === 'intermediate' ? 'New Intermediate Step' : 'New Attack Leaf',
            description: '',
            status: NeedStatus.OPEN,
            tags: [type],
            links: [],
            position: { x: parentNode.position.x, y: parentNode.position.y + 150 },
            ...(type === 'intermediate' && { logic_gate: 'OR' }),
            ...(type === 'leaf' && { attackPotential: { time: 0, expertise: 0, knowledge: 0, access: 0, equipment: 0 } }),
        };

        const newNeeds = [...project.needs, newNode];
        const parentNeedIndex = newNeeds.findIndex(n => n.id === parentNode.id);

        if (parentNeedIndex !== -1) {
            const parentNeed = { ...newNeeds[parentNeedIndex] };
            parentNeed.links = [...(parentNeed.links || []), newNodeId];
            // Set logic gate for roots when they have children
            if (parentNeed.tags.includes('attack-root') && parentNeed.links.length > 1 && !parentNeed.logic_gate) {
                parentNeed.logic_gate = 'AND'; // Attack tree roots are always AND nodes
            } else if (parentNeed.tags.includes('circumvent-root') && parentNeed.links.length > 1 && !parentNeed.logic_gate) {
                parentNeed.logic_gate = 'OR'; // Circumvent tree roots default to OR
            }
            newNeeds[parentNeedIndex] = parentNeed;
        }

        onUpdateNeeds(newNeeds, `Added new ${type} node '${newNodeId}' as child of '${parentNode.id}'.`);
    }, [project.needs, onUpdateNeeds, isReadOnly, closeContextMenu]);

    const handleUnlinkNode = useCallback((nodeId: string) => {
        if (isReadOnly) return;
        closeContextMenu();
        const updatedNeeds = project.needs.map(need => {
            if (need.links?.includes(nodeId)) {
                return { ...need, links: need.links.filter(link => link !== nodeId) };
            }
            return need;
        });
        onUpdateNeeds(updatedNeeds, `Unlinked node '${nodeId}' from all parents.`);
    }, [project.needs, onUpdateNeeds, isReadOnly, closeContextMenu]);

    const handleUnlinkCircumventTree = useCallback((circumventTreeId: string) => {
        if (isReadOnly) return;

        const circumventTree = project.needs.find(n => n.id === circumventTreeId);
        if (!circumventTree || !circumventTree.tags.includes('circumvent-root')) {
            return;
        }

        closeContextMenu();

        // Find all parent nodes that link to this circumvent tree
        const parentNodes = project.needs.filter(need => need.links?.includes(circumventTreeId));

        if (parentNodes.length === 0) {
            return;
        }

        // Remove the link from all parent nodes
        const updatedNeeds = project.needs.map(need => {
            if (need.links?.includes(circumventTreeId)) {
                return { ...need, links: need.links.filter(link => link !== circumventTreeId) };
            }
            return need;
        });

        // Remove from collapsed set
        setCollapsedCircumventTrees(prev => {
            const newSet = new Set(prev);
            newSet.delete(circumventTreeId);
            return newSet;
        });

        onUpdateNeeds(updatedNeeds, `Unlinked circumvent tree '${circumventTreeId}' from attack tree. The tree is still available in the project.`);
    }, [project.needs, onUpdateNeeds, isReadOnly, closeContextMenu, setCollapsedCircumventTrees]);

    const handleDeleteNodeFromProject = useCallback((nodeId: string) => {
        if (isReadOnly) return;

        setConfirmationModal({
            isOpen: true,
            title: 'Delete Node from Project',
            message: `Are you sure you want to permanently delete node ${nodeId} from the project? This will remove it from all attack trees.`,
            confirmLabel: 'Delete',
            isDangerous: true,
            onConfirm: () => {
                closeContextMenu();

                const newNeeds: SphinxNeed[] = [];
                for (const need of project.needs) {
                    if (need.id === nodeId) {
                        continue;
                    }

                    if (need.links && need.links.includes(nodeId)) {
                        newNeeds.push({
                            ...need,
                            links: need.links.filter(linkId => linkId !== nodeId),
                        });
                    } else {
                        newNeeds.push(need);
                    }
                }

                onUpdateNeeds(newNeeds, `Deleted node '${nodeId}' from project.`);
                onSelectNeed(null);
                setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }, [project, onUpdateNeeds, onSelectNeed, isReadOnly, closeContextMenu, setConfirmationModal]);

    const handleLinkExisting = useCallback((parentNode: Node<SphinxNeed>, childIdToLink: string) => {
        if (isReadOnly) return;

        const updatedNeeds = [...project.needs];
        const parentNeedIndex = updatedNeeds.findIndex(n => n.id === parentNode.id);
        const childNeed = updatedNeeds.find(n => n.id === childIdToLink);

        if (parentNeedIndex !== -1 && childNeed) {
            const parentNeed = { ...updatedNeeds[parentNeedIndex] };

            // Prevent linking a technical tree to itself
            const isChildTechnicalTree = childNeed.tags.includes('technical-root');
            if (isChildTechnicalTree) {
                // Find which technical tree (if any) the parent node belongs to
                const parentTechnicalRoot = findTechnicalTreeRoot(parentNeed.id, project.needs);

                // If parent belongs to the same technical tree we're trying to link, prevent it (self-linking)
                if (parentTechnicalRoot && parentTechnicalRoot.id === childIdToLink) {
                    closeContextMenu();
                    return;
                }
            }

            // Prevent linking a circumvent tree to itself
            const isChildCircumventTree = childNeed.tags.includes('circumvent-root');
            if (isChildCircumventTree) {
                // Find which circumvent tree (if any) the parent node belongs to
                const parentCircumventRoot = findCircumventTreeRoot(parentNeed.id, project.needs);

                // If parent belongs to the same circumvent tree we're trying to link, prevent it (self-linking)
                if (parentCircumventRoot && parentCircumventRoot.id === childIdToLink) {
                    closeContextMenu();
                    return;
                }
            }

            if (!(parentNeed.links || []).includes(childIdToLink)) {
                parentNeed.links = [...(parentNeed.links || []), childIdToLink];

                // Per ISO/SAE 21434: Set parent to AND gate when linking a circumvent tree
                if (isChildCircumventTree && parentNeed.logic_gate !== 'OR') {
                    // Automatically set to AND when linking a circumvent tree
                    parentNeed.logic_gate = 'AND';

                    // Automatically collapse the circumvent tree when it's linked
                    setCollapsedCircumventTrees(prev => new Set(prev).add(childIdToLink));
                } else if (isChildTechnicalTree) {
                    // Technical trees are reusable subtrees - no special gate logic required
                    // They can be linked to any node type (attack, circumvent, or technical trees)
                    // Keep existing logic gate or set default if needed
                    if ((parentNeed.tags.includes('attack-root') || parentNeed.tags.includes('circumvent-root') || parentNeed.tags.includes('technical-root')) && parentNeed.links.length > 1 && !parentNeed.logic_gate) {
                        parentNeed.logic_gate = 'OR';
                    }
                } else if ((parentNeed.tags.includes('attack-root') || parentNeed.tags.includes('circumvent-root')) && parentNeed.links.length > 1 && !parentNeed.logic_gate) {
                    // Default logic gate for root nodes with multiple children
                    parentNeed.logic_gate = 'OR';
                }

                updatedNeeds[parentNeedIndex] = parentNeed;
                onUpdateNeeds(updatedNeeds, `Linked existing node '${childIdToLink}' to '${parentNode.id}'.`);
            }
        }
        closeContextMenu();
    }, [project.needs, onUpdateNeeds, isReadOnly, closeContextMenu, setCollapsedCircumventTrees]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node<SphinxNeed>) => {
        onSelectNeed(node.data);
        closeContextMenu();
    }, [onSelectNeed, closeContextMenu]);

    const onPaneClick = useCallback(() => {
        onSelectNeed(null);
        closeContextMenu();
    }, [onSelectNeed, closeContextMenu]);

    const handleLayout = useCallback(() => {
        if (isReadOnly || !selectedTreeRootId) return;

        const layoutedNeeds = getLayoutedElements(selectedTreeRootId, project.needs, {
            nodeWidth: 256,
            nodeHeight: 150,
            horizontalGap: 80,
            verticalGap: 100,
        }, layoutDirection);

        onUpdateNeeds(layoutedNeeds, `Applied ${layoutDirection === 'TB' ? 'top-to-bottom' : 'left-to-right'} layout to tree '${selectedTreeRootId}'.`);
    }, [selectedTreeRootId, project.needs, onUpdateNeeds, isReadOnly, layoutDirection]);

    const isNodeLeaf = contextMenu?.node.data.type === NeedType.ATTACK && !contextMenu?.node.data.logic_gate && !contextMenu?.node.data.tags.includes('attack-root') && !contextMenu?.node.data.tags.includes('circumvent-root') && !contextMenu?.node.data.tags.includes('technical-root');

    return (
        <div className="w-full h-full relative" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onNodeDragStop={onNodeDragStop}
                onEdgesDelete={onEdgesDelete}
                onNodeContextMenu={onNodeContextMenu}
                nodeTypes={memoizedNodeTypes}
                className="bg-vscode-bg-main"
                fitView
                nodesDraggable={!isReadOnly}
                nodesConnectable={!isReadOnly}
                elementsSelectable={true}
                panOnDrag={!isReadOnly}
            >
                <Controls />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#3e3e42" />
            </ReactFlow>

            {treeMetrics && (
                <div className="absolute top-4 left-4 bg-vscode-bg-sidebar/90 backdrop-blur-sm border border-vscode-border p-3 rounded-lg text-vscode-text-primary text-sm shadow-lg">
                    <div className="font-bold text-base mb-2">Tree Analysis</div>

                    {/* Initial AFR (without circumvent trees) */}
                    <div className="mb-3">
                        <div className="text-xs text-vscode-text-secondary mb-1 font-semibold">
                            {treeMetrics.hasCircumventTrees ? 'Initial Risk (without controls)' : 'Risk Assessment'}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div>
                                <div className="text-xs text-vscode-text-secondary">Attack Potential (AP)</div>
                                <div className="text-2xl font-mono font-bold text-vscode-accent">{treeMetrics.attackPotential}</div>
                            </div>
                            <div>
                                <div className="text-xs text-vscode-text-secondary">Feasibility (AFR)</div>
                                <div className={`text-lg font-bold px-2 py-0.5 rounded ${getFeasibilityRatingColor(treeMetrics.afr)}`}>
                                    {treeMetrics.afr}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Residual AFR (with circumvent trees) - only shown if circumvent trees exist */}
                    {treeMetrics.hasCircumventTrees && treeMetrics.residualAfr && (
                        <div className="pt-3 border-t border-vscode-border">
                            <div className="text-xs text-vscode-text-secondary mb-1 font-semibold">Residual Risk (with controls)</div>
                            <div className="flex items-center space-x-4">
                                <div>
                                    <div className="text-xs text-vscode-text-secondary">Attack Potential (AP)</div>
                                    <div className="text-2xl font-mono font-bold text-green-400">{treeMetrics.residualAttackPotential}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-vscode-text-secondary">Feasibility (AFR)</div>
                                    <div className={`text-lg font-bold px-2 py-0.5 rounded ${getFeasibilityRatingColor(treeMetrics.residualAfr)}`}>
                                        {treeMetrics.residualAfr}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-xs text-vscode-text-secondary mt-2 italic">Critical path is highlighted in red.</div>
                </div>
            )}

            <div className="absolute top-4 right-4 bg-vscode-bg-sidebar/90 backdrop-blur-sm border border-vscode-border rounded-lg shadow-lg">
                <div className="p-2 space-y-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-vscode-text-secondary font-medium">Layout Direction:</span>
                        <div className="flex border border-vscode-border rounded overflow-hidden">
                            <button
                                onClick={() => setLayoutDirection('TB')}
                                className={`px-3 py-1 text-xs font-medium transition-colors ${layoutDirection === 'TB'
                                    ? 'bg-vscode-accent text-vscode-text-bright'
                                    : 'bg-vscode-bg-input text-vscode-text-primary hover:bg-vscode-bg-hover'
                                    }`}
                                title="Top to Bottom (Default)"
                            >
                                ↓ TB
                            </button>
                            <button
                                onClick={() => setLayoutDirection('LR')}
                                className={`px-3 py-1 text-xs font-medium transition-colors border-l border-vscode-border ${layoutDirection === 'LR'
                                    ? 'bg-vscode-accent text-vscode-text-bright'
                                    : 'bg-vscode-bg-input text-vscode-text-primary hover:bg-vscode-bg-hover'
                                    }`}
                                title="Left to Right"
                            >
                                → LR
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleLayout}
                        disabled={isReadOnly || !selectedTreeRootId}
                        className="w-full flex items-center justify-center px-3 py-1.5 bg-vscode-accent text-vscode-text-bright rounded-md text-xs font-medium hover:bg-vscode-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Apply ${layoutDirection === 'TB' ? 'top-to-bottom' : 'left-to-right'} layout`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0h9.75m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                        </svg>
                        Apply Auto Layout
                    </button>
                </div>
            </div>

            {contextMenu && (
                <div
                    style={{ top: contextMenu.top, left: contextMenu.left }}
                    className="absolute z-50 bg-vscode-bg-sidebar border border-vscode-border rounded-md shadow-xl text-vscode-text-primary text-sm animate-fade-in-fast"
                >
                    <div className="p-1">
                        <div className="px-3 py-1.5 text-xs text-vscode-text-secondary border-b border-vscode-border mb-1">Actions for {contextMenu.node.id}</div>
                        {!isNodeLeaf && (
                            <>
                                <button onClick={() => handleAddNode(contextMenu.node, 'intermediate')} className="w-full text-left px-3 py-1.5 hover:bg-vscode-bg-hover rounded flex items-center transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-vscode-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Add Intermediate Node
                                </button>
                                <button onClick={() => handleAddNode(contextMenu.node, 'leaf')} className="w-full text-left px-3 py-1.5 hover:bg-vscode-bg-hover rounded flex items-center transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6-4l-1.5-1.5L12 9.75 7.5 5.25 6 6.75l6 6 7.5-7.5-1.5-1.5z" /></svg>
                                    Add New Attack Leaf
                                </button>
                                <div
                                    className="relative"
                                    onMouseEnter={() => setIsLinkLeafSubMenuOpen(true)}
                                    onMouseLeave={() => setIsLinkLeafSubMenuOpen(false)}
                                >
                                    <div className="w-full text-left px-3 py-1.5 hover:bg-vscode-bg-hover rounded flex items-center transition-colors cursor-pointer justify-between">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.596a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Link Existing Leaf
                                        </div>
                                        <span className="text-vscode-text-secondary text-xs">&#9656;</span>
                                    </div>
                                    {isLinkLeafSubMenuOpen && (
                                        <div className="absolute left-full -top-1 ml-1 w-64 bg-vscode-bg-sidebar border border-vscode-border rounded-md shadow-lg p-1">
                                            <input
                                                type="text"
                                                placeholder="Search by ID or title..."
                                                value={leafSearch}
                                                onChange={e => { e.stopPropagation(); setLeafSearch(e.target.value); }}
                                                onClick={e => e.stopPropagation()}
                                                className="w-full bg-vscode-bg-input text-vscode-text-primary text-xs rounded-sm px-2 py-1 mb-1 border border-vscode-border-light focus:ring-vscode-accent focus:border-vscode-accent"
                                            />
                                            <div className="max-h-48 overflow-y-auto">
                                                {filteredLeaves.length > 0 ? filteredLeaves.map(leaf => (
                                                    <button
                                                        key={leaf.id}
                                                        onClick={() => handleLinkExisting(contextMenu.node, leaf.id)}
                                                        className="w-full text-left text-xs px-2 py-1.5 hover:bg-vscode-bg-hover rounded"
                                                        title={leaf.title}
                                                    >
                                                        <span className="font-mono text-vscode-accent">{leaf.id}</span>
                                                        <span className="block text-vscode-text-primary truncate">{leaf.title}</span>
                                                    </button>
                                                )) : (
                                                    <div className="text-center text-xs text-vscode-text-secondary py-2">No leaves found.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="relative"
                                    onMouseEnter={() => setIsLinkCTSubMenuOpen(true)}
                                    onMouseLeave={() => setIsLinkCTSubMenuOpen(false)}
                                >
                                    <div className="w-full text-left px-3 py-1.5 hover:bg-vscode-bg-hover rounded flex items-center transition-colors cursor-pointer justify-between">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.596a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Link Circumvent Tree
                                        </div>
                                        <span className="text-vscode-text-secondary text-xs">&#9656;</span>
                                    </div>
                                    {isLinkCTSubMenuOpen && (
                                        <div className="absolute left-full -top-1 ml-1 w-64 bg-vscode-bg-sidebar border border-vscode-border rounded-md shadow-lg p-1">
                                            <input
                                                type="text"
                                                placeholder="Search by ID or title..."
                                                value={ctSearch}
                                                onChange={e => { e.stopPropagation(); setCtSearch(e.target.value); }}
                                                onClick={e => e.stopPropagation()}
                                                className="w-full bg-vscode-bg-input text-vscode-text-primary text-xs rounded-sm px-2 py-1 mb-1 border border-vscode-border-light focus:ring-vscode-accent focus:border-vscode-accent"
                                            />
                                            <div className="max-h-48 overflow-y-auto">
                                                {filteredCTs.length > 0 ? filteredCTs.map(ct => (
                                                    <button
                                                        key={ct.id}
                                                        onClick={() => handleLinkExisting(contextMenu.node, ct.id)}
                                                        className="w-full text-left text-xs px-2 py-1.5 hover:bg-vscode-bg-hover rounded"
                                                        title={ct.title}
                                                    >
                                                        <span className="font-mono text-teal-400">{ct.id}</span>
                                                        <span className="block text-vscode-text-primary truncate">{ct.title}</span>
                                                    </button>
                                                )) : (
                                                    <div className="text-center text-xs text-vscode-text-secondary py-2">No circumvent trees found.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="relative"
                                    onMouseEnter={() => setIsLinkTTSubMenuOpen(true)}
                                    onMouseLeave={() => setIsLinkTTSubMenuOpen(false)}
                                >
                                    <div className="w-full text-left px-3 py-1.5 hover:bg-vscode-bg-hover rounded flex items-center transition-colors cursor-pointer justify-between">
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.596a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Link Technical Tree
                                        </div>
                                        <span className="text-vscode-text-secondary text-xs">&#9656;</span>
                                    </div>
                                    {isLinkTTSubMenuOpen && (
                                        <div className="absolute left-full -top-1 ml-1 w-64 bg-vscode-bg-sidebar border border-vscode-border rounded-md shadow-lg p-1">
                                            <input
                                                type="text"
                                                placeholder="Search by ID or title..."
                                                value={ttSearch}
                                                onChange={e => { e.stopPropagation(); setTtSearch(e.target.value); }}
                                                onClick={e => e.stopPropagation()}
                                                className="w-full bg-vscode-bg-input text-vscode-text-primary text-xs rounded-sm px-2 py-1 mb-1 border border-vscode-border-light focus:ring-vscode-accent focus:border-vscode-accent"
                                            />
                                            <div className="max-h-48 overflow-y-auto">
                                                {filteredTTs.length > 0 ? filteredTTs.map(tt => (
                                                    <button
                                                        key={tt.id}
                                                        onClick={() => handleLinkExisting(contextMenu.node, tt.id)}
                                                        className="w-full text-left text-xs px-2 py-1.5 hover:bg-vscode-bg-hover rounded"
                                                        title={tt.title}
                                                    >
                                                        <span className="font-mono text-purple-400">{tt.id}</span>
                                                        <span className="block text-vscode-text-primary truncate">{tt.title}</span>
                                                    </button>
                                                )) : (
                                                    <div className="text-center text-xs text-vscode-text-secondary py-2">No technical trees found.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {contextMenu.node.data.tags.includes('circumvent-root') && !(project.needs.find(n => n.id === selectedTreeRootId)?.tags.includes('circumvent-root')) && (
                            <>
                                <div className="h-px bg-vscode-border my-1"></div>
                                <button onClick={() => handleUnlinkCircumventTree(contextMenu.node.id)} className="w-full text-left px-3 py-1.5 hover:bg-vscode-bg-hover rounded flex items-center transition-colors text-teal-300">
                                    <LinkBreakIcon className="h-4 w-4 mr-2" />
                                    Unlink Circumvent Tree
                                </button>
                            </>
                        )}
                        {contextMenu.node.data.tags.includes('technical-root') && !(project.needs.find(n => n.id === selectedTreeRootId)?.tags.includes('technical-root')) && (
                            <>
                                <div className="h-px bg-vscode-border my-1"></div>
                                <button onClick={() => handleUnlinkNode(contextMenu.node.id)} className="w-full text-left px-3 py-1.5 hover:bg-vscode-bg-hover rounded flex items-center transition-colors text-purple-300">
                                    <LinkBreakIcon className="h-4 w-4 mr-2" />
                                    Unlink Technical Tree
                                </button>
                            </>
                        )}
                        {!(contextMenu.node.data.tags.includes('attack-root') || contextMenu.node.data.tags.includes('circumvent-root') || contextMenu.node.data.tags.includes('technical-root')) && (
                            <>
                                <div className="h-px bg-vscode-border my-1"></div>
                                <button onClick={() => handleUnlinkNode(contextMenu.node.id)} className="w-full text-left px-3 py-1.5 hover:bg-vscode-bg-hover rounded flex items-center transition-colors text-yellow-300">
                                    <LinkBreakIcon className="h-4 w-4 mr-2" />
                                    Unlink Node
                                </button>
                                <button onClick={() => handleDeleteNodeFromProject(contextMenu.node.id)} className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 rounded flex items-center transition-colors text-red-300">
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Delete from Project
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
            {errorModal.isOpen && (
                <ErrorModal
                    message={errorModal.message}
                    onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                />
            )}
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                title={confirmationModal.title}
                message={confirmationModal.message}
                confirmLabel={confirmationModal.confirmLabel}
                isDangerous={confirmationModal.isDangerous}
                onConfirm={confirmationModal.onConfirm}
                onCancel={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};


const getTreeNodes = (rootId: string, allNeeds: SphinxNeed[]): SphinxNeed[] => {
    const needsMap = new Map(allNeeds.map(n => [n.id, n]));
    const treeNodeIds = new Set<string>();
    const queue: string[] = [rootId];
    treeNodeIds.add(rootId);

    while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId) continue;
        const currentNode = needsMap.get(currentId);
        if (currentNode && currentNode.links) {
            for (const link of currentNode.links) {
                if (needsMap.has(link) && !treeNodeIds.has(link)) {
                    treeNodeIds.add(link);
                    queue.push(link);
                }
            }
        }
    }
    return allNeeds.filter(n => treeNodeIds.has(n.id));
};

const generateUniqueNeedId = (prefix: string, allNeeds: SphinxNeed[]): string => {
    const existingIds = new Set(allNeeds.map(n => n.id));
    let i = 1;
    for (const id of existingIds) {
        // FIX: Add type guard to prevent calling string methods on unknown type.
        if (typeof id === 'string' && id.startsWith(`${prefix}_`)) {
            const num = parseInt(id.substring(prefix.length + 1), 10);
            if (!isNaN(num) && num >= i) { i = num + 1; }
        }
    }
    let newId;
    do {
        newId = `${prefix}_${String(i).padStart(3, '0')}`;
        i++;
    } while (existingIds.has(newId));
    return newId;
};


export const AttackTreeEditor: React.FC<AttackTreeEditorProps> = (props) => {
    const { project, onUpdateNeed, isReadOnly } = props;
    const [selectedNeed, setSelectedNeed] = useState<SphinxNeed | null>(null);

    const attackTreeRoots = useMemo(() =>
        project.needs.filter(n => n.type === NeedType.ATTACK && n.tags.includes('attack-root')),
        [project.needs]
    );

    const circumventTreeRoots = useMemo(() =>
        project.needs.filter(n => n.type === NeedType.ATTACK && n.tags.includes('circumvent-root')),
        [project.needs]
    );

    const technicalTreeRoots = useMemo(() =>
        project.needs.filter(n => n.type === NeedType.ATTACK && n.tags.includes('technical-root')),
        [project.needs]
    );

    const [selectedTreeRootId, setSelectedTreeRootId] = useState<string | null>(attackTreeRoots[0]?.id || circumventTreeRoots[0]?.id || technicalTreeRoots[0]?.id || null);

    useEffect(() => {
        const allRoots = [...attackTreeRoots, ...circumventTreeRoots, ...technicalTreeRoots];
        if (!selectedTreeRootId && allRoots.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedTreeRootId(allRoots[0].id);
        }
        if (selectedTreeRootId && !allRoots.some(r => r.id === selectedTreeRootId)) {
             
            setSelectedTreeRootId(allRoots[0]?.id || null);
        }
    }, [attackTreeRoots, circumventTreeRoots, technicalTreeRoots, selectedTreeRootId]);

    const handleSelectNeed = useCallback((need: SphinxNeed | null) => {
        setSelectedNeed(need);
    }, []);

    const handleNeedChange = useCallback((updatedNeed: SphinxNeed) => {
        if (isReadOnly) return;
        if (selectedNeed?.id === updatedNeed.id) {
            setSelectedNeed(updatedNeed);
        }
        onUpdateNeed(updatedNeed);
    }, [selectedNeed, onUpdateNeed, isReadOnly]);


    return (
        <div className="flex h-full w-full">
            <aside className="w-1/4 max-w-xs border-r border-vscode-border flex flex-col">
                <div className="p-4 border-b border-vscode-border">
                    <h2 className="text-2xl font-bold text-vscode-text-primary text-vscode-text-bright">Tree Explorer</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {attackTreeRoots.length > 0 && (
                        <div className="mb-4">
                            <h3 className="px-3 py-1 text-sm font-semibold text-vscode-text-secondary">Attack Trees</h3>
                            <ul className="space-y-1">
                                {attackTreeRoots.map(root => (
                                    <li key={root.id}>
                                        <button
                                            onClick={() => setSelectedTreeRootId(root.id)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                        ${selectedTreeRootId === root.id
                                                    ? 'bg-vscode-accent/30 text-vscode-accent font-semibold'
                                                    : 'text-vscode-text-primary hover:bg-vscode-bg-hover'
                                                }`}
                                        >
                                            <span className="font-mono text-vscode-accent text-xs block">{root.id}</span>
                                            {root.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {circumventTreeRoots.length > 0 && (
                        <div>
                            <h3 className="px-3 py-1 text-sm font-semibold text-vscode-text-secondary">Circumvent Trees</h3>
                            <ul className="space-y-1">
                                {circumventTreeRoots.map(root => (
                                    <li key={root.id}>
                                        <button
                                            onClick={() => setSelectedTreeRootId(root.id)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                        ${selectedTreeRootId === root.id
                                                    ? 'bg-teal-600/30 text-teal-200 font-semibold'
                                                    : 'text-vscode-text-primary hover:bg-vscode-bg-hover'
                                                }`}
                                        >
                                            <span className="font-mono text-teal-400 text-xs block">{root.id}</span>
                                            {root.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {technicalTreeRoots.length > 0 && (
                        <div className="mb-4">
                            <h3 className="px-3 py-1 text-sm font-semibold text-vscode-text-secondary">Technical Attack Trees</h3>
                            <ul className="space-y-1">
                                {technicalTreeRoots.map(root => (
                                    <li key={root.id}>
                                        <button
                                            onClick={() => setSelectedTreeRootId(root.id)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                        ${selectedTreeRootId === root.id
                                                    ? 'bg-purple-600/30 text-purple-200 font-semibold'
                                                    : 'text-vscode-text-primary hover:bg-vscode-bg-hover'
                                                }`}
                                        >
                                            <span className="font-mono text-purple-400 text-xs block">{root.id}</span>
                                            {root.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {attackTreeRoots.length === 0 && circumventTreeRoots.length === 0 && technicalTreeRoots.length === 0 && (
                        <div className="p-4 text-center text-vscode-text-secondary text-sm">
                            <p>No attack trees found.</p>
                            <p className="mt-2">Threats, Circumvent Trees, and Technical Attack Trees will appear here as roots.</p>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1 h-full flex">
                <div className="flex-1 h-full relative">
                    <ReactFlowProvider>
                        <AttackTreeCanvas {...props} onSelectNeed={handleSelectNeed} selectedTreeRootId={selectedTreeRootId} />
                    </ReactFlowProvider>
                </div>
                {selectedNeed && (
                    <PropertiesPanel
                        key={selectedNeed.id}
                        need={selectedNeed}
                        project={project}
                        onChange={handleNeedChange}
                        isReadOnly={isReadOnly}
                    />
                )}
            </main>
        </div>
    );
};