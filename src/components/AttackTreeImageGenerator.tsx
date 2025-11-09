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
import { NeedType, Project, SphinxNeed } from '../types';

// --- Helper functions for isolated rendering ---

const getNodeColor = (need: SphinxNeed): string => {
    if (need.type !== NeedType.ATTACK) return 'bg-vscode-bg-input border-vscode-border';
    if (need.tags.includes('circumvent-root')) return 'bg-teal-700 border-teal-500';

    const isRoot = need.tags.includes('attack-root');
    const isIntermediate = !!need.logic_gate && !isRoot;

    if (isIntermediate) return 'bg-blue-600 border-blue-400';
    return 'bg-red-800 border-red-500';
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

const StaticNode: React.FC<{ data: SphinxNeed }> = ({ data }) => {
    const isRoot = data.tags.includes('attack-root') || data.tags.includes('circumvent-root');
    const isLeaf = data.type === NeedType.ATTACK && !data.logic_gate && !isRoot;
    const totalAp = isLeaf ? Object.values(data.attackPotential || {}).reduce((sum: number, val) => sum + Number(val || 0), 0) : null;

    return (
        <>
            {!isRoot && <Handle type="target" position={Position.Top} className="!bg-vscode-bg-input !border-indigo-400" />}
            <div className={`${getNodeColor(data)} rounded-lg p-3 w-64 text-white shadow-xl border-2`}>
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

        const allTreeNodes = getTreeNodes(rootId, layoutedNeeds);
        const visibleNeeds = allTreeNodes.filter(n => n.type !== 'risk' && n.type !== 'mitigation');
        const visibleNeedsMap = new Map(visibleNeeds.map(need => [need.id, need]));

        const flowNodes: Node<SphinxNeed>[] = visibleNeeds.map(need => ({
            id: need.id,
            type: 'static',
            position: need.position || { x: 0, y: 0 },
            data: need,
        }));

        const flowEdges: Edge[] = visibleNeeds.map(need =>
            (need.links || []).filter(linkId => visibleNeedsMap.has(linkId)).map(linkId => ({
                id: `${need.id}-${linkId}`,
                source: need.id,
                target: linkId,
                type: 'smoothstep',
                style: { stroke: '#818cf8', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#818cf8' },
            }))
        ).flat();

        return { nodes: flowNodes, edges: flowEdges };
    }, [project, rootId]);

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
