import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
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
    useReactFlow,
} from 'reactflow';
import { calculateAttackTreeMetrics, calculateNodeMetrics, traceCriticalPaths } from '../services/attackTreeService';
import { accessOptions, equipmentOptions, expertiseOptions, knowledgeOptions, timeOptions } from '../services/feasibilityOptions';
import { getAttackFeasibilityRating, getFeasibilityRatingColor } from '../services/riskService';
import { AttackFeasibilityRating, AttackPotentialTuple, NeedStatus, NeedType, Project, SphinxNeed } from '../types';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { ClockIcon } from './icons/ClockIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { KeyIcon } from './icons/KeyIcon';
import { LinkBreakIcon } from './icons/LinkBreakIcon';
import { TrashIcon } from './icons/TrashIcon';
import { WrenchIcon } from './icons/WrenchIcon';
import { PropertiesPanel } from './PropertiesPanel';

interface AttackTreeEditorProps {
    project: Project;
    onUpdateNeeds: (needs: SphinxNeed[], historyMessage: string) => void;
    onUpdateNeed: (need: SphinxNeed) => void;
    onSelectNeed: (need: SphinxNeed | null) => void;
    isReadOnly: boolean;
}

const getNodeColor = (need: SphinxNeed): string => {
    if (need.type !== NeedType.ATTACK) {
        return 'bg-vscode-bg-input border-vscode-border';
    }
    if (need.tags.includes('circumvent-root')) {
        return 'bg-teal-700 border-teal-500';
    }

    const isRoot = need.tags.includes('attack-root');
    const isIntermediate = !!need.logic_gate && !isRoot;

    if (isIntermediate) {
        return 'bg-blue-600 border-blue-400';
    }

    return 'bg-red-800 border-red-500';
};


const apConfig: { [key in keyof AttackPotentialTuple]: { icon: React.FC<any>, options: { value: number, label: string }[] } } = {
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
    project: Project
}> = ({ data, selected, isCritical, onUpdateNeed, isReadOnly, project }) => {
    const isRoot = data.tags.includes('attack-root') || data.tags.includes('circumvent-root');
    const isLeaf = data.type === NeedType.ATTACK && !data.logic_gate && !isRoot;
    const isIntermediate = data.type === NeedType.ATTACK && !isLeaf && !isRoot;

    const handlePotentialChange = (field: keyof AttackPotentialTuple, value: string) => {
        if (isReadOnly) return;
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
            return calculateNodeMetrics(data.id, project.needs, project.toeConfigurations);
        }
        return null;
    }, [data.id, data.links, project.needs, project.toeConfigurations, isIntermediate, isRoot]);

    return (
        <>
            {!isRoot && (
                <Handle
                    type="target"
                    position={Position.Top}
                    id="target"
                    className={`!w-3 !h-3 border-2 transition-colors ${isCritical ? '!bg-red-400 !border-red-200' : '!bg-vscode-bg-input !border-vscode-accent'}`}
                />
            )}
            <div className={`
                ${getNodeColor(data)}
                rounded-lg p-3 w-64 text-vscode-text-primary shadow-xl
                border-2 transition-all relative cursor-pointer
                ${selected ? 'ring-4 ring-offset-2 ring-offset-vscode-bg-main ring-vscode-accent' : ''}
                ${isLeaf ? 'border-dashed' : ''}
                ${isCritical ? 'border-red-400 shadow-red-500/30' : ''}
            `}>
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
                )}

                {/* No paths message for nodes without subtrees */}
                {(isIntermediate || isRoot) && calculatedMetrics && !calculatedMetrics.hasSubtree && (
                    <div className="mt-2 pt-2 border-t border-vscode-border-light text-center">
                        <div className="text-xs text-vscode-text-secondary">No attack paths</div>
                    </div>
                )}

                {isLeaf && <ApEditor potential={data.attackPotential} onUpdate={handlePotentialChange} isReadOnly={isReadOnly} />}
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                id="source"
                className={`!w-3 !h-3 border-2 transition-colors ${isCritical ? '!bg-red-400 !border-red-200' : '!bg-vscode-bg-input !border-vscode-accent'}`}
            />
        </>
    );
};

const getLayoutedElements = (rootId: string, allNeeds: SphinxNeed[], options: { nodeWidth: number, nodeHeight: number, horizontalGap: number, verticalGap: number }) => {
    const treeNodes = getTreeNodes(rootId, allNeeds);
    const needsMap = new Map(treeNodes.map(n => [n.id, n]));
    const treeNodeIds = new Set(treeNodes.map(n => n.id));

    // 1. Assign ranks (y-level) using BFS.
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

    // 2. Assign positions.
    const newPositions = new Map<string, { x: number, y: number }>();
    const { nodeWidth, nodeHeight, horizontalGap, verticalGap } = options;

    for (let i = 0; i <= maxRank; i++) {
        const nodesInRank = ranks.get(i) || [];
        const rankWidth = nodesInRank.length * nodeWidth + Math.max(0, nodesInRank.length - 1) * horizontalGap;
        let currentX = -rankWidth / 2;

        nodesInRank.forEach(nodeId => {
            const y = i * (nodeHeight + verticalGap);
            newPositions.set(nodeId, { x: currentX, y });
            currentX += nodeWidth + horizontalGap;
        });
    }

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
    const [leafSearch, setLeafSearch] = useState('');
    const [ctSearch, setCtSearch] = useState('');

    const [treeMetrics, setTreeMetrics] = useState<{ attackPotential: number; afr: AttackFeasibilityRating; } | null>(null);
    const [criticalNodeIds, setCriticalNodeIds] = useState<Set<string>>(new Set());

    const allAttackLeaves = useMemo(() => {
        return project.needs.filter(n =>
            n.type === NeedType.ATTACK &&
            !n.logic_gate &&
            !n.tags.includes('attack-root') &&
            !n.tags.includes('circumvent-root')
        ).sort((a, b) => a.id.localeCompare(b.id));
    }, [project.needs]);

    const allCircumventTreeRoots = useMemo(() => {
        return project.needs.filter(n =>
            n.type === NeedType.ATTACK &&
            n.tags.includes('circumvent-root')
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
        if (!ctSearch) return allCircumventTreeRoots;
        const searchTerm = ctSearch.toLowerCase();
        return allCircumventTreeRoots.filter(ct =>
            ct.id.toLowerCase().includes(searchTerm) ||
            ct.title.toLowerCase().includes(searchTerm)
        );
    }, [allCircumventTreeRoots, ctSearch]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
        setIsLinkLeafSubMenuOpen(false);
        setIsLinkCTSubMenuOpen(false);
        setLeafSearch('');
        setCtSearch('');
    }, []);

    useEffect(() => {
        if (selectedTreeRootId) {
            const metrics = calculateAttackTreeMetrics(selectedTreeRootId, project.needs, project.toeConfigurations);
            if (metrics) {
                setTreeMetrics({
                    attackPotential: metrics.attackPotential,
                    afr: getAttackFeasibilityRating(metrics.attackPotential)
                });
                const allCriticalNodes = traceCriticalPaths(selectedTreeRootId, metrics.criticalPaths, project.needs);
                setCriticalNodeIds(allCriticalNodes);
            } else {
                setTreeMetrics(null);
                setCriticalNodeIds(new Set());
            }
        }
    }, [selectedTreeRootId, project.needs, project.toeConfigurations]);

    const memoizedNodeTypes = useMemo(() => ({
        custom: (props: any) => <CustomNode {...props} isCritical={criticalNodeIds.has(props.data.id)} onUpdateNeed={onUpdateNeed} isReadOnly={isReadOnly} project={project} />
    }), [criticalNodeIds, onUpdateNeed, isReadOnly, project]);

    useEffect(() => {
        if (!selectedTreeRootId) {
            setNodes([]);
            setEdges([]);
            return;
        }

        const allTreeNodes = getTreeNodes(selectedTreeRootId, project.needs);
        const visibleNeeds = allTreeNodes.filter(n => n.type !== NeedType.RISK && n.type !== NeedType.MITIGATION);
        const visibleNeedsMap = new Map(visibleNeeds.map(need => [need.id, need]));

        const flowNodes: Node<SphinxNeed>[] = visibleNeeds.map(need => ({
            id: need.id,
            type: 'custom',
            position: need.position || { x: Math.random() * 800, y: Math.random() * 600 },
            data: need,
        }));

        const flowEdges: Edge[] = [];
        visibleNeeds.forEach(need => {
            (need.links || []).forEach(linkId => {
                if (visibleNeedsMap.has(linkId)) {
                    const isCritical = criticalNodeIds.has(need.id) && criticalNodeIds.has(linkId);
                    flowEdges.push({
                        id: `${need.id}-${linkId}`,
                        source: need.id,
                        target: linkId,
                        type: 'smoothstep',
                        animated: isCritical,
                        style: { stroke: isCritical ? '#f87171' : '#818cf8', strokeWidth: isCritical ? 3 : 2 },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            width: 20,
                            height: 20,
                            color: isCritical ? '#f87171' : '#818cf8',
                        },
                    });
                }
            });
        });

        setNodes(flowNodes);
        setEdges(flowEdges);

        setTimeout(() => fitView({ duration: 300 }), 0);

    }, [selectedTreeRootId, project.needs, fitView, criticalNodeIds]);

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

        if (targetNeed.type === NeedType.RISK || targetNeed.type === NeedType.MITIGATION) {
            alert('Connection to RISK or MITIGATION nodes is not allowed in the attack tree view.');
            return;
        }

        const isSourceRoot = sourceNeed.tags.includes('attack-root') || sourceNeed.tags.includes('circumvent-root');
        const isSourceLeaf = sourceNeed.type === NeedType.ATTACK && !sourceNeed.logic_gate && !isSourceRoot;
        if (isSourceLeaf) {
            alert('Connection failed: An Attack Leaf cannot have outgoing connections.');
            return;
        }

        if (targetNeed.tags.includes('circumvent-root')) {
            if (sourceNeed.logic_gate === 'AND') {
                // Valid
            } else if (sourceNeed.logic_gate === 'OR') {
                const childLinks = [...(sourceNeed.links || []), params.target];
                const allChildrenAreCTs = childLinks.every(childId => {
                    const childNode = project.needs.find(n => n.id === childId);
                    return childNode?.tags.includes('circumvent-root');
                });
                if (!allChildrenAreCTs) {
                    alert('A Circumvent Tree can only be a child of an OR node if all other children of that node are also Circumvent Trees.');
                    return;
                }
            } else {
                alert('A Circumvent Tree must be a child of an AND node (or an OR node if all siblings are also Circumvent Trees).');
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
            updatedNeeds[sourceNeedIndex] = sourceNeedToUpdate;
            onUpdateNeeds(updatedNeeds, `Connected '${params.source}' to '${params.target}'.`);
        }

    }, [project.needs, onUpdateNeeds, setEdges, isReadOnly]);

    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node<SphinxNeed>) => {
        if (isReadOnly) return;
        event.preventDefault();
        const pane = reactFlowWrapper.current?.getBoundingClientRect();
        if (!pane) return;

        setContextMenu({ top: event.clientY - pane.top, left: event.clientX - pane.left, node: node });
    }, [isReadOnly]);

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
            if ((parentNeed.tags.includes('attack-root') || parentNeed.tags.includes('circumvent-root')) && parentNeed.links.length > 1 && !parentNeed.logic_gate) {
                parentNeed.logic_gate = 'OR';
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


    const handleDeleteNodeFromProject = useCallback((nodeId: string) => {
        if (isReadOnly) return;
        if (!window.confirm(`Are you sure you want to permanently delete node ${nodeId} from the project? This will remove it from all attack trees.`)) {
            closeContextMenu();
            return;
        }

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
    }, [project, onUpdateNeeds, onSelectNeed, isReadOnly, closeContextMenu]);

    const handleLinkExisting = useCallback((parentNode: Node<SphinxNeed>, childIdToLink: string) => {
        if (isReadOnly) return;

        const updatedNeeds = [...project.needs];
        const parentNeedIndex = updatedNeeds.findIndex(n => n.id === parentNode.id);

        if (parentNeedIndex !== -1) {
            const parentNeed = { ...updatedNeeds[parentNeedIndex] };
            if (!(parentNeed.links || []).includes(childIdToLink)) {
                parentNeed.links = [...(parentNeed.links || []), childIdToLink];
                if ((parentNeed.tags.includes('attack-root') || parentNeed.tags.includes('circumvent-root')) && parentNeed.links.length > 1 && !parentNeed.logic_gate) {
                    parentNeed.logic_gate = 'OR';
                }
                updatedNeeds[parentNeedIndex] = parentNeed;
                onUpdateNeeds(updatedNeeds, `Linked existing node '${childIdToLink}' to '${parentNode.id}'.`);
            }
        }
        closeContextMenu();
    }, [project.needs, onUpdateNeeds, isReadOnly, closeContextMenu]);

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
        });

        onUpdateNeeds(layoutedNeeds, `Applied auto-layout to tree '${selectedTreeRootId}'.`);
    }, [selectedTreeRootId, project.needs, onUpdateNeeds, isReadOnly]);

    const isNodeLeaf = contextMenu?.node.data.type === NeedType.ATTACK && !contextMenu?.node.data.logic_gate && !contextMenu?.node.data.tags.includes('attack-root') && !contextMenu?.node.data.tags.includes('circumvent-root');

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
                    <div className="text-xs text-vscode-text-secondary mt-2 italic">Critical path is highlighted in red.</div>
                </div>
            )}

            <div className="absolute top-4 right-4 bg-vscode-bg-sidebar/90 backdrop-blur-sm border border-vscode-border p-2 rounded-lg shadow-lg">
                <button
                    onClick={handleLayout}
                    disabled={isReadOnly || !selectedTreeRootId}
                    className="flex items-center px-3 py-1.5 bg-vscode-accent text-vscode-text-bright rounded-md text-xs font-medium hover:bg-vscode-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Apply automatic layout (Top to Bottom)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0h9.75m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                    Auto Layout
                </button>
            </div>

            {contextMenu && (
                <div
                    style={{ top: contextMenu.top, left: contextMenu.left }}
                    className="absolute z-50 bg-vscode-bg-sidebar/95 backdrop-blur-sm border border-vscode-border rounded-md shadow-lg text-vscode-text-primary text-sm animate-fade-in-fast"
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
                            </>
                        )}
                        {!(contextMenu.node.data.tags.includes('attack-root') || contextMenu.node.data.tags.includes('circumvent-root')) && (
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

    const [selectedTreeRootId, setSelectedTreeRootId] = useState<string | null>(attackTreeRoots[0]?.id || circumventTreeRoots[0]?.id || null);

    useEffect(() => {
        const allRoots = [...attackTreeRoots, ...circumventTreeRoots];
        if (!selectedTreeRootId && allRoots.length > 0) {
            setSelectedTreeRootId(allRoots[0].id);
        }
        if (selectedTreeRootId && !allRoots.some(r => r.id === selectedTreeRootId)) {
            setSelectedTreeRootId(allRoots[0]?.id || null);
        }
    }, [attackTreeRoots, circumventTreeRoots, selectedTreeRootId]);

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

                    {attackTreeRoots.length === 0 && circumventTreeRoots.length === 0 && (
                        <div className="p-4 text-center text-vscode-text-secondary text-sm">
                            <p>No attack trees found.</p>
                            <p className="mt-2">Threats and Circumvent Trees will appear here as roots.</p>
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