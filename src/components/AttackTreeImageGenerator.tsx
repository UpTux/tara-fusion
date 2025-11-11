import { toPng } from 'html-to-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Edge,
    Handle,
    MarkerType,
    Node,
    Position,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow';
import { calculateAttackTreeMetrics, hasCircumventTrees } from '../services/attackTreeService';
import { getAttackFeasibilityRating } from '../services/riskService';
import { AttackFeasibilityRating, NeedType, Project, SphinxNeed } from '../types';

// --- Helper functions for isolated rendering ---

const getNodeColor = (need: SphinxNeed, afr?: AttackFeasibilityRating, residualAfr?: AttackFeasibilityRating): string => {
    if (need.type !== NeedType.ATTACK) {
        return 'bg-vscode-bg-input border-vscode-border';
    }
    if (need.tags.includes('circumvent-root')) {
        return 'bg-teal-700 border-teal-500';
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

const getTreeNodes = (rootId: string, allNeeds: SphinxNeed[], includeCircumventTrees: boolean = true): SphinxNeed[] => {
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
                const linkedNode = needsMap.get(link);
                // Include all linked nodes
                if (linkedNode && !treeNodeIds.has(link)) {
                    treeNodeIds.add(link);
                    queue.push(link);
                }
            }
        }
    }
    return allNeeds.filter(n => treeNodeIds.has(n.id));
};

const getLayoutedElements = (rootId: string, allNeeds: SphinxNeed[], options: { nodeWidth: number, nodeHeight: number, horizontalGap: number, verticalGap: number }) => {
    const treeNodes = getTreeNodes(rootId, allNeeds);
    const needsMap = new Map(treeNodes.map(n => [n.id, n]));
    const treeNodeIds = new Set(treeNodes.map(n => n.id));

    const ranks: Map<number, string[]> = new Map();
    const queue: { id: string, rank: number }[] = [{ id: rootId, rank: 0 }];
    const visited = new Set<string>([rootId]);
    let maxRank = 0;

    while (queue.length > 0) {
        const { id, rank } = queue.shift() ?? { id: "", rank: 0 };
        if (!ranks.has(rank)) ranks.set(rank, []);
        const rankList = ranks.get(rank);
        if (rankList) rankList.push(id);
        maxRank = Math.max(maxRank, rank);

        const node = needsMap.get(id);
        if (node?.links) {
            for (const childId of node.links) {
                if (treeNodeIds.has(childId) && !visited.has(childId)) {
                    visited.add(childId);
                    queue.push({ id: childId, rank: rank + 1 });
                }
            }
        }
    }

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

    return allNeeds.map(need => {
        if (newPositions.has(need.id)) {
            return { ...need, position: newPositions.get(need.id) ?? need.position };
        }
        return need;
    });
};

const StaticNode: React.FC<{ data: SphinxNeed; afr?: AttackFeasibilityRating; residualAfr?: AttackFeasibilityRating }> = ({ data, afr, residualAfr }) => {
    const isRoot = data.tags.includes('attack-root') || data.tags.includes('circumvent-root');
    const isLeaf = data.type === NeedType.ATTACK && !data.logic_gate && !isRoot;
    const totalAp = isLeaf ? Object.values(data.attackPotential || {}).reduce((sum: number, val) => sum + Number(val || 0), 0) : null;

    const isAttackRoot = data.tags.includes('attack-root');
    const showTargetHandle = !isAttackRoot && (!data.tags.includes('circumvent-root') || false);

    return (
        <>
            {showTargetHandle && <Handle type="target" position={Position.Top} className="!bg-vscode-bg-input !border-indigo-400" />}
            <div className={`${getNodeColor(data, afr, residualAfr)} rounded-lg p-3 w-64 text-white shadow-xl border-2`}>
                {data.logic_gate && (
                    <div className="absolute -top-3 -right-3 bg-vscode-bg-sidebar border-2 border-indigo-400 rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs text-indigo-300">
                        {data.logic_gate}
                    </div>
                )}
                <div className="font-bold text-sm truncate">{data.id}</div>
                <div className="text-xs text-vscode-text-primary uppercase font-mono tracking-wider mb-2">{data.type}</div>
                <div className="text-sm">{data.title}</div>
                {isLeaf && totalAp !== null && (
                    <div className="mt-2 pt-2 border-t border-vscode-border text-xs font-mono text-vscode-text-primary">
                        <span>AP Total: </span>
                        <span className="font-bold text-indigo-300">{totalAp}</span>
                    </div>
                )}
                {isAttackRoot && afr && (
                    <div className="mt-2 pt-2 border-t border-vscode-border text-xs font-mono">
                        <div className="flex justify-between">
                            <span className="text-vscode-text-primary">AFR:</span>
                            <span className="font-bold text-indigo-300">{afr}</span>
                        </div>
                        {residualAfr && residualAfr !== afr && (
                            <div className="flex justify-between mt-1">
                                <span className="text-vscode-text-primary">Residual AFR:</span>
                                <span className="font-bold text-green-300">{residualAfr}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-vscode-bg-input !border-indigo-400" />
        </>
    );
};

const memoizedNodeTypes = { static: StaticNode };

interface TreeRendererProps {
    project: Project;
    rootId: string;
    onRendered: (rootId: string, dataUrl: string) => void;
}

const TreeRenderer: React.FC<TreeRendererProps> = ({ project, rootId, onRendered }) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { fitView } = useReactFlow();
    const [reactFlowStyles, setReactFlowStyles] = useState<string | null>(null);
    const [isFlowInitialized, setIsFlowInitialized] = useState(false);

    // Calculate metrics for the root node
    const rootNode = project.needs.find(n => n.id === rootId);
    const isAttackRoot = rootNode?.tags.includes('attack-root');

    const metrics = useMemo(() => {
        if (!isAttackRoot || !rootNode) return undefined;
        return calculateAttackTreeMetrics(rootId, project.needs, project.toeConfigurations || [], false);
    }, [isAttackRoot, rootNode, rootId, project.needs, project.toeConfigurations]);

    const afr = metrics ? getAttackFeasibilityRating(metrics.attackPotential) : undefined;

    const residualMetrics = useMemo(() => {
        if (!isAttackRoot || !rootNode) return undefined;
        const hasCircumvent = hasCircumventTrees(rootId, project.needs);
        if (!hasCircumvent) return undefined;
        return calculateAttackTreeMetrics(rootId, project.needs, project.toeConfigurations || [], true);
    }, [isAttackRoot, rootNode, rootId, project.needs, project.toeConfigurations]);

    const residualAfr = residualMetrics ? getAttackFeasibilityRating(residualMetrics.attackPotential) : undefined;

    useEffect(() => {
        fetch('https://cdn.jsdelivr.net/npm/reactflow@11.11.3/dist/style.css')
            .then(response => response.text())
            .then(text => setReactFlowStyles(text))
            .catch(e => {
                console.error('Failed to fetch ReactFlow styles:', e);
                onRendered(rootId, 'error-style-fetch');
            });
    }, [rootId, onRendered]);

    const { nodes, edges } = useMemo(() => {
        const layoutedNeeds = getLayoutedElements(rootId, project.needs, {
            nodeWidth: 256,
            nodeHeight: 150,
            horizontalGap: 80,
            verticalGap: 100,
        });

        const allTreeNodes = getTreeNodes(rootId, layoutedNeeds, true); // Include circumvent trees
        const visibleNeeds = allTreeNodes.filter(n => n.type !== 'risk' && n.type !== 'mitigation');
        const visibleNeedsMap = new Map(visibleNeeds.map(need => [need.id, need]));

        const flowNodes: Node<SphinxNeed & { afr?: AttackFeasibilityRating; residualAfr?: AttackFeasibilityRating }>[] = visibleNeeds.map(need => {
            // Only pass AFR values for the root node
            const nodeData = need.id === rootId && isAttackRoot
                ? { ...need, afr, residualAfr }
                : need;

            return {
                id: need.id,
                type: 'static',
                position: need.position || { x: 0, y: 0 },
                data: nodeData,
            };
        });

        const flowEdges: Edge[] = visibleNeeds.map(need =>
            (need.links || []).filter(linkId => visibleNeedsMap.has(linkId)).map(linkId => {
                const targetNode = visibleNeedsMap.get(linkId);
                const isCircumventConnection = targetNode?.tags.includes('circumvent-root');

                return {
                    id: `${need.id}-${linkId}`,
                    source: need.id,
                    target: linkId,
                    type: 'smoothstep',
                    style: {
                        stroke: isCircumventConnection ? '#14b8a6' : '#818cf8', // teal for circumvent connections
                        strokeWidth: isCircumventConnection ? 3 : 2,
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: isCircumventConnection ? '#14b8a6' : '#818cf8',
                    },
                };
            })
        ).flat();

        return { nodes: flowNodes, edges: flowEdges };
    }, [project, rootId, isAttackRoot, afr, residualAfr]);

    const onInit = useCallback(() => setIsFlowInitialized(true), []);

    useEffect(() => {
        if (!isFlowInitialized || !reactFlowStyles) {
            return; // Wait for both flow and styles to be ready
        }

        fitView({ duration: 0, padding: 0.2 });

        const generateImage = async () => {
            if (!reactFlowWrapper.current) {
                console.error(`Ref for tree ${rootId} was null, could not generate image.`);
                onRendered(rootId, 'error-null-ref');
                return;
            }

            // Temporarily disable the external stylesheet to prevent CORS errors
            const linkSelector = 'link[href*="reactflow"]';
            const link = document.querySelector<HTMLLinkElement>(linkSelector);
            if (link) {
                link.disabled = true;
            }

            try {
                const dataUrl = await toPng(reactFlowWrapper.current, {
                    backgroundColor: '#1e1e1e', // vscode dark background
                    width: 1920,
                    height: 1080,
                    pixelRatio: 1,
                });
                onRendered(rootId, dataUrl);
            } catch (error) {
                console.error(`Failed to generate image for tree ${rootId}:`, error);
                onRendered(rootId, 'error-png-generation');
            } finally {
                // Always re-enable the stylesheet
                if (link) {
                    link.disabled = false;
                }
            }
        };

        // Use requestAnimationFrame to ensure the layout is painted before capture
        requestAnimationFrame(generateImage);

    }, [isFlowInitialized, reactFlowStyles, fitView, onRendered, rootId]);


    return (
        <div ref={reactFlowWrapper} style={{ width: 1920, height: 1080, background: '#1e1e1e' }}>
            {reactFlowStyles && <style>{reactFlowStyles}</style>}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onInit={onInit}
                nodeTypes={memoizedNodeTypes}
                fitView
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#4a5568" />
            </ReactFlow>
        </div>
    );
};

interface AttackTreeImageGeneratorProps {
    project: Project;
    onComplete: (images: Map<string, string>) => void;
}

export const AttackTreeImageGenerator: React.FC<AttackTreeImageGeneratorProps> = ({ project, onComplete }) => {
    const attackTreeRoots = useMemo(() =>
        project.needs.filter(n => n.type === NeedType.ATTACK && (n.tags.includes('attack-root') || n.tags.includes('circumvent-root'))),
        [project.needs]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const imagesRef = useRef<Map<string, string>>(new Map());

    const onCompleteRef = useRef(onComplete);
    useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

    useEffect(() => {
        if (attackTreeRoots.length === 0) {
            onCompleteRef.current(new Map());
        }
    }, [attackTreeRoots.length]);

    const handleCapture = useCallback((rootId: string, dataUrl: string) => {
        if (dataUrl.startsWith('error')) {
            console.error(`Skipping image for ${rootId} due to error: ${dataUrl}`);
        } else {
            imagesRef.current.set(rootId, dataUrl);
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex >= attackTreeRoots.length) {
            onCompleteRef.current(imagesRef.current);
        } else {
            setCurrentIndex(nextIndex);
        }
    }, [currentIndex, attackTreeRoots.length]);

    if (attackTreeRoots.length === 0 || currentIndex >= attackTreeRoots.length) {
        return null;
    }

    const currentRoot = attackTreeRoots[currentIndex];

    return (
        <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
            <ReactFlowProvider key={currentRoot.id}>
                <TreeRenderer
                    project={project}
                    rootId={currentRoot.id}
                    onRendered={handleCapture}
                />
            </ReactFlowProvider>
        </div>
    );
};
