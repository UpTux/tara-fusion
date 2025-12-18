import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    Handle,
    MarkerType,
    MiniMap,
    Node,
    NodeProps,
    Panel,
    Position,
    useEdgesState,
    useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Project } from '../types';

interface TraceabilityGraphViewProps {
    project: Project;
}

// Color scheme for different artifact types
const artifactColors = {
    assumption: { bg: '#FFC107', border: '#FFB300', text: '#000' },
    toeConfiguration: { bg: '#9E9E9E', border: '#757575', text: '#fff' },
    asset: { bg: '#A9A9A9', border: '#808080', text: '#fff' },
    damageScenario: { bg: '#CD5C5C', border: '#B22222', text: '#fff' },
    threat: { bg: '#F29379', border: '#E57373', text: '#000' },
    threatScenario: { bg: '#FFA07A', border: '#FF8C69', text: '#000' },
    attackTree: { bg: '#FF6666', border: '#FF4444', text: '#fff' },
    circumventTree: { bg: '#14b8a6', border: '#0d9488', text: '#fff' },
    misuseCase: { bg: '#FF5722', border: '#E64A19', text: '#fff' },
    securityControl: { bg: '#9C27B0', border: '#7B1FA2', text: '#fff' },
    securityGoal: { bg: '#4CAF50', border: '#388E3C', text: '#fff' },
    securityClaim: { bg: '#2196F3', border: '#1976D2', text: '#fff' },
};

// Custom node component for traceability artifacts
const ArtifactNode: React.FC<NodeProps<{ label: string; type: string; subtitle?: string }>> = ({ data }) => {
    const colors = artifactColors[data.type as keyof typeof artifactColors] || artifactColors.asset;

    return (
        <>
            <Handle type="target" position={Position.Top} className="!w-2 !h-2" />
            <div
                className="px-4 py-2 rounded-lg shadow-lg border-2 min-w-[180px] max-w-[250px]"
                style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                }}
            >
                <div className="font-semibold text-sm truncate">{data.label}</div>
                {data.subtitle && (
                    <div className="text-xs opacity-80 truncate mt-0.5">{data.subtitle}</div>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-2 !h-2" />
        </>
    );
};

const nodeTypes = {
    artifact: ArtifactNode,
};

type LayoutType = 'hierarchical' | 'grid' | 'radial' | 'force';

export const TraceabilityGraphView: React.FC<TraceabilityGraphViewProps> = ({ project }) => {
    const { t } = useTranslation();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [selectedLayout, setSelectedLayout] = useState<LayoutType>('hierarchical');
    const [selectedToeConfigs, setSelectedToeConfigs] = useState<Set<string>>(new Set());

    // Layout algorithms
    const applyLayout = useCallback((nodes: Node[], layoutType: LayoutType): Node[] => {
        const nodesCopy = nodes.map(n => ({ ...n }));

        switch (layoutType) {
            case 'hierarchical':
                // Already laid out in layers during graph generation
                return nodesCopy;

            case 'grid': {
                // Arrange nodes in a grid
                const gridCols = Math.ceil(Math.sqrt(nodesCopy.length));
                const gridSpacing = 300;
                nodesCopy.forEach((node, index) => {
                    const row = Math.floor(index / gridCols);
                    const col = index % gridCols;
                    node.position = {
                        x: col * gridSpacing - (gridCols * gridSpacing) / 2,
                        y: row * gridSpacing,
                    };
                });
                return nodesCopy;
            }

            case 'radial': {
                // Arrange nodes in a circle
                const radius = Math.max(300, nodesCopy.length * 30);
                const centerX = 0;
                const centerY = 0;
                nodesCopy.forEach((node, index) => {
                    const angle = (index / nodesCopy.length) * 2 * Math.PI;
                    node.position = {
                        x: centerX + radius * Math.cos(angle),
                        y: centerY + radius * Math.sin(angle),
                    };
                });
                return nodesCopy;
            }

            case 'force': {
                // Simple force-directed layout (spring-based)
                const iterations = 50;
                const repulsionStrength = 10000;

                // Initialize with hierarchical positions or random if not set
                nodesCopy.forEach(node => {
                    if (!node.position || (node.position.x === 0 && node.position.y === 0)) {
                        node.position = {
                            x: (Math.random() - 0.5) * 1000,
                            y: (Math.random() - 0.5) * 1000,
                        };
                    }
                });

                // Run force simulation
                for (let iter = 0; iter < iterations; iter++) {
                    const forces = new Map<string, { x: number; y: number }>();
                    nodesCopy.forEach(n => forces.set(n.id, { x: 0, y: 0 }));

                    // Repulsion between all nodes
                    for (let i = 0; i < nodesCopy.length; i++) {
                        for (let j = i + 1; j < nodesCopy.length; j++) {
                            const node1 = nodesCopy[i];
                            const node2 = nodesCopy[j];
                            const dx = node2.position.x - node1.position.x;
                            const dy = node2.position.y - node1.position.y;
                            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                            const force = repulsionStrength / (distance * distance);

                            const fx = (dx / distance) * force;
                            const fy = (dy / distance) * force;

                            const f1 = forces.get(node1.id)!;
                            const f2 = forces.get(node2.id)!;
                            f1.x -= fx;
                            f1.y -= fy;
                            f2.x += fx;
                            f2.y += fy;
                        }
                    }

                    // Apply forces
                    nodesCopy.forEach(node => {
                        const force = forces.get(node.id)!;
                        node.position.x += force.x;
                        node.position.y += force.y;
                    });
                }

                // Center the layout
                const avgX = nodesCopy.reduce((sum, n) => sum + n.position.x, 0) / nodesCopy.length;
                const avgY = nodesCopy.reduce((sum, n) => sum + n.position.y, 0) / nodesCopy.length;
                nodesCopy.forEach(node => {
                    node.position.x -= avgX;
                    node.position.y -= avgY;
                });

                return nodesCopy;
            }

            default:
                return nodesCopy;
        }
    }, []);

    // Build the graph from project data
    const { graphNodes, graphEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        let yOffset = 0;
        const layerHeight = 150;
        const nodeSpacing = 250;

        // Helper to create a layer of nodes
        const createLayer = (items: any[], type: string, labelField: string, subtitleField?: string) => {
            const layer: Node[] = [];
            items.forEach((item, index) => {
                const xPos = (index - (items.length - 1) / 2) * nodeSpacing;
                layer.push({
                    id: item.id,
                    type: 'artifact',
                    position: { x: xPos, y: yOffset },
                    data: {
                        label: item[labelField] || item.id,
                        subtitle: subtitleField ? item[subtitleField] : undefined,
                        type,
                    },
                });
            });
            yOffset += layerHeight;
            return layer;
        };

        // Layer 1: TOE Configuration & Assumptions
        const toeLayer = createLayer(project.toeConfigurations || [], 'toeConfiguration', 'name');
        const assumptionLayer = createLayer(project.assumptions || [], 'assumption', 'name');
        nodes.push(...toeLayer, ...assumptionLayer);

        // Layer 2: Assets
        yOffset += 50; // Extra spacing
        const assetLayer = createLayer(project.assets || [], 'asset', 'name');
        nodes.push(...assetLayer);

        // Create edges from assets to TOE configurations
        (project.assets || []).forEach(asset => {
            (asset.toeConfigurationIds || []).forEach(toeId => {
                edges.push({
                    id: `${asset.id}-${toeId}`,
                    source: toeId,
                    target: asset.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#888', strokeWidth: 1.5 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#888' },
                });
            });
        });

        // Layer 3: Misuse Cases
        const misuseCaseLayer = createLayer(project.misuseCases || [], 'misuseCase', 'name');
        nodes.push(...misuseCaseLayer);

        // Create edges from misuse cases to assets
        (project.misuseCases || []).forEach(mc => {
            (mc.assetIds || []).forEach(assetId => {
                edges.push({
                    id: `${mc.id}-${assetId}`,
                    source: assetId,
                    target: mc.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#FF5722', strokeWidth: 1.5 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#FF5722' },
                });
            });
        });

        // Layer 4: Damage Scenarios
        yOffset += 50;
        const damageScenarioLayer = createLayer(project.damageScenarios || [], 'damageScenario', 'name', 'impact');
        nodes.push(...damageScenarioLayer);

        // Layer 5: Threats
        const threatLayer = createLayer(project.threats || [], 'threat', 'name', 'securityProperty');
        nodes.push(...threatLayer);

        // Create edges from threats to assets and damage scenarios
        (project.threats || []).forEach(threat => {
            // Threat to asset
            if (threat.assetId) {
                edges.push({
                    id: `${threat.id}-${threat.assetId}`,
                    source: threat.assetId,
                    target: threat.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#F29379', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#F29379' },
                });
            }

            // Threat to damage scenarios
            (threat.damageScenarioIds || []).forEach(dsId => {
                edges.push({
                    id: `${threat.id}-${dsId}`,
                    source: threat.id,
                    target: dsId,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#CD5C5C', strokeWidth: 1.5 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#CD5C5C' },
                });
            });

            // Threat to misuse cases
            (threat.misuseCaseIds || []).forEach(mcId => {
                edges.push({
                    id: `${threat.id}-${mcId}`,
                    source: mcId,
                    target: threat.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#FF5722', strokeWidth: 1.5, strokeDasharray: '5,5' },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#FF5722' },
                });
            });
        });

        // Layer 6: Threat Scenarios
        yOffset += 50;
        const threatScenarioLayer = createLayer(project.threatScenarios || [], 'threatScenario', 'name');
        nodes.push(...threatScenarioLayer);

        // Create edges from threat scenarios to threats and damage scenarios
        (project.threatScenarios || []).forEach(ts => {
            // Threat scenario to threat
            if (ts.threatId) {
                edges.push({
                    id: `${ts.id}-${ts.threatId}`,
                    source: ts.threatId,
                    target: ts.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#FFA07A', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#FFA07A' },
                });
            }

            // Threat scenario to damage scenarios
            (ts.damageScenarioIds || []).forEach(dsId => {
                edges.push({
                    id: `${ts.id}-ds-${dsId}`,
                    source: ts.id,
                    target: dsId,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#CD5C5C', strokeWidth: 1.5, strokeDasharray: '3,3' },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#CD5C5C' },
                });
            });
        });

        // Layer 7: Attack Trees (from needs)
        const attackTrees = (project.needs || []).filter(n =>
            n.type === 'attack' && n.tags.includes('attack-root')
        );
        const attackTreeLayer = createLayer(attackTrees, 'attackTree', 'title');
        nodes.push(...attackTreeLayer);

        // Link attack trees to threats (they have the same ID)
        attackTrees.forEach(at => {
            const threat = (project.threats || []).find(t => t.id === at.id);
            if (threat) {
                edges.push({
                    id: `${at.id}-threat`,
                    source: at.id,
                    target: threat.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#FF6666', strokeWidth: 2, strokeDasharray: '5,5' },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#FF6666' },
                });
            }
        });

        // Layer 8: Circumvent Trees
        const circumventTrees = (project.needs || []).filter(n =>
            n.type === 'attack' && n.tags.includes('circumvent-root')
        );
        const circumventTreeLayer = createLayer(circumventTrees, 'circumventTree', 'title');
        nodes.push(...circumventTreeLayer);

        // Layer 9: Security Controls
        yOffset += 50;
        const securityControlLayer = createLayer(project.securityControls || [], 'securityControl', 'name');
        nodes.push(...securityControlLayer);

        // Link security controls to circumvent trees
        (project.securityControls || []).forEach(sc => {
            (sc.circumventTreeRootIds || []).forEach(ctId => {
                edges.push({
                    id: `${sc.id}-${ctId}`,
                    source: sc.id,
                    target: ctId,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#14b8a6', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#14b8a6' },
                });
            });
        });

        // Layer 10: Security Goals
        const securityGoalLayer = createLayer(project.securityGoals || [], 'securityGoal', 'name');
        nodes.push(...securityGoalLayer);

        // Link security goals to security controls
        (project.securityControls || []).forEach(sc => {
            (sc.securityGoalIds || []).forEach(sgId => {
                edges.push({
                    id: `${sc.id}-${sgId}`,
                    source: sgId,
                    target: sc.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#4CAF50', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#4CAF50' },
                });
            });
        });

        // Link threat scenarios to security goals
        (project.threatScenarios || []).forEach(ts => {
            (ts.securityGoalIds || []).forEach(sgId => {
                edges.push({
                    id: `${ts.id}-${sgId}`,
                    source: ts.id,
                    target: sgId,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#4CAF50', strokeWidth: 2, strokeDasharray: '5,5' },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#4CAF50' },
                });
            });
        });

        // Layer 11: Security Claims
        const securityClaimLayer = createLayer(project.securityClaims || [], 'securityClaim', 'name');
        nodes.push(...securityClaimLayer);

        // Link security claims to assumptions
        (project.securityClaims || []).forEach(sc => {
            (sc.assumptionIds || []).forEach(assId => {
                edges.push({
                    id: `${sc.id}-${assId}`,
                    source: assId,
                    target: sc.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#2196F3', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#2196F3' },
                });
            });
        });

        // Link threat scenarios to security claims
        (project.threatScenarios || []).forEach(ts => {
            (ts.securityClaimIds || []).forEach(scId => {
                edges.push({
                    id: `${ts.id}-claim-${scId}`,
                    source: ts.id,
                    target: scId,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#2196F3', strokeWidth: 2, strokeDasharray: '5,5' },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#2196F3' },
                });
            });
        });

        return { graphNodes: nodes, graphEdges: edges };
    }, [project]);

    // Update nodes and edges when graph changes
    useEffect(() => {
        setNodes(graphNodes);
        setEdges(graphEdges);
    }, [graphNodes, graphEdges, setNodes, setEdges]);

    // Filter options
    const filterOptions = [
        { value: 'all', label: 'All Artifacts' },
        { value: 'threats', label: 'Threat Chain' },
        { value: 'security', label: 'Security Chain' },
        { value: 'assets', label: 'Asset Dependencies' },
    ];

    // Helper function to get all connected artifact IDs for a TOE configuration
    const getConnectedArtifacts = useCallback((toeConfigIds: Set<string>): Set<string> => {
        if (toeConfigIds.size === 0) return new Set();

        const connectedIds = new Set<string>(toeConfigIds);
        const toProcess = Array.from(toeConfigIds);

        while (toProcess.length > 0) {
            const currentId = toProcess.shift()!;

            // Find all edges where current node is the source
            graphEdges.forEach(edge => {
                if (edge.source === currentId && !connectedIds.has(edge.target)) {
                    connectedIds.add(edge.target);
                    toProcess.push(edge.target);
                }
            });
        }

        return connectedIds;
    }, [graphEdges]);

    const handleFilterChange = useCallback((filter: string) => {
        setSelectedFilter(filter);

        // Apply filter logic
        let filteredNodes: Node[] = [];
        let filteredEdges: Edge[] = [];

        if (filter === 'all') {
            filteredNodes = graphNodes;
            filteredEdges = graphEdges;
        } else if (filter === 'threats') {
            // Show only threat-related artifacts
            const threatTypes = new Set(['asset', 'damageScenario', 'threat', 'threatScenario', 'attackTree', 'misuseCase']);
            filteredNodes = graphNodes.filter(n => threatTypes.has(n.data.type));
            const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
            filteredEdges = graphEdges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
        } else if (filter === 'security') {
            // Show only security-related artifacts
            const securityTypes = new Set(['threatScenario', 'securityControl', 'securityGoal', 'securityClaim', 'assumption', 'circumventTree']);
            filteredNodes = graphNodes.filter(n => securityTypes.has(n.data.type));
            const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
            filteredEdges = graphEdges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
        } else if (filter === 'assets') {
            // Show only asset dependencies
            const assetTypes = new Set(['toeConfiguration', 'asset', 'threat', 'misuseCase']);
            filteredNodes = graphNodes.filter(n => assetTypes.has(n.data.type));
            const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
            filteredEdges = graphEdges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
        }

        // Apply TOE configuration filter if active
        if (selectedToeConfigs.size > 0) {
            const connectedIds = getConnectedArtifacts(selectedToeConfigs);
            filteredNodes = filteredNodes.filter(n => connectedIds.has(n.id));
            const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
            filteredEdges = filteredEdges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
        }

        // Apply current layout to filtered nodes
        const layoutedNodes = applyLayout(filteredNodes, selectedLayout);
        setNodes(layoutedNodes);
        setEdges(filteredEdges);
    }, [graphNodes, graphEdges, selectedLayout, selectedToeConfigs, applyLayout, getConnectedArtifacts, setNodes, setEdges]);

    // Handle layout change
    const handleLayoutChange = useCallback((layout: LayoutType) => {
        setSelectedLayout(layout);
        const currentNodes = selectedFilter === 'all' ? graphNodes : nodes;
        const layoutedNodes = applyLayout(currentNodes, layout);
        setNodes(layoutedNodes);
    }, [graphNodes, nodes, selectedFilter, applyLayout, setNodes]);

    // Handle TOE configuration selection
    const handleToeConfigToggle = useCallback((toeConfigId: string) => {
        setSelectedToeConfigs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(toeConfigId)) {
                newSet.delete(toeConfigId);
            } else {
                newSet.add(toeConfigId);
            }
            return newSet;
        });
    }, []);

    // Re-apply filters when TOE config selection changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleFilterChange(selectedFilter);
    }, [selectedToeConfigs, handleFilterChange, selectedFilter]);

    // Layout options
    const layoutOptions = [
        { value: 'hierarchical' as LayoutType, label: 'Hierarchical', icon: '📊' },
        { value: 'grid' as LayoutType, label: 'Grid', icon: '⊞' },
        { value: 'radial' as LayoutType, label: 'Radial', icon: '◉' },
        { value: 'force' as LayoutType, label: 'Force', icon: '⚡' },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-vscode-border bg-vscode-bg-sidebar">
                <h2 className="text-xl font-bold text-vscode-text-primary mb-3">
                    {t('traceabilityGraphTitle')}
                </h2>

                {/* Compact filter toolbar - spreadsheet style */}
                <div className="flex items-center gap-3 text-sm">
                    {/* Layout dropdown */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-vscode-text-secondary font-medium whitespace-nowrap">
                            Layout:
                        </label>
                        <select
                            value={selectedLayout}
                            onChange={(e) => handleLayoutChange(e.target.value as LayoutType)}
                            className="px-2 py-1 text-xs rounded border border-vscode-border bg-vscode-bg-input text-vscode-text-primary focus:outline-none focus:ring-1 focus:ring-vscode-accent"
                        >
                            {layoutOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.icon} {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Vertical separator */}
                    <div className="h-6 w-px bg-vscode-border" />

                    {/* Filter dropdown */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-vscode-text-secondary font-medium whitespace-nowrap">
                            View:
                        </label>
                        <select
                            value={selectedFilter}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-vscode-border bg-vscode-bg-input text-vscode-text-primary focus:outline-none focus:ring-1 focus:ring-vscode-accent"
                        >
                            {filterOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Vertical separator */}
                    {project.toeConfigurations && project.toeConfigurations.length > 0 && (
                        <>
                            <div className="h-6 w-px bg-vscode-border" />

                            {/* TOE Configuration multi-select */}
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-vscode-text-secondary font-medium whitespace-nowrap">
                                    TOE Config:
                                </label>
                                <select
                                    multiple
                                    value={Array.from(selectedToeConfigs)}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                                        setSelectedToeConfigs(new Set(selected));
                                    }}
                                    className="px-2 py-1 text-xs rounded border border-vscode-border bg-vscode-bg-input text-vscode-text-primary focus:outline-none focus:ring-1 focus:ring-vscode-accent max-h-[120px]"
                                    style={{ minWidth: '150px' }}
                                >
                                    {project.toeConfigurations.map(toe => (
                                        <option key={toe.id} value={toe.id}>
                                            {toe.name}
                                        </option>
                                    ))}
                                </select>
                                {selectedToeConfigs.size > 0 && (
                                    <button
                                        onClick={() => setSelectedToeConfigs(new Set())}
                                        className="px-2 py-1 text-xs rounded border border-vscode-border bg-vscode-bg-input text-vscode-text-secondary hover:text-vscode-text-primary hover:bg-vscode-bg-hover transition-colors"
                                        title="Clear TOE configuration filter"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Graph */}
            <div className="flex-1 bg-vscode-bg">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    minZoom={0.1}
                    maxZoom={2}
                >
                    <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#4a5568" />
                    <Controls className="bg-vscode-bg-input border border-vscode-border" />
                    <MiniMap
                        className="bg-vscode-bg-sidebar border border-vscode-border"
                        nodeColor={(node) => {
                            const colors = artifactColors[node.data.type as keyof typeof artifactColors];
                            return colors?.bg || '#888';
                        }}
                        maskColor="rgba(0, 0, 0, 0.6)"
                        nodeStrokeWidth={3}
                        style={{
                            backgroundColor: '#1e1e1e',
                        }}
                    />

                    {/* Legend */}
                    <Panel position="top-right" className="bg-vscode-bg-sidebar border border-vscode-border rounded-lg p-3">
                        <div className="text-xs text-vscode-text-primary font-semibold mb-2">Legend</div>
                        <div className="space-y-1 text-xs">
                            {Object.entries(artifactColors).map(([key, colors]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded border"
                                        style={{
                                            backgroundColor: colors.bg,
                                            borderColor: colors.border,
                                        }}
                                    />
                                    <span className="text-vscode-text-secondary capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
};
