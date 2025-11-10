import { NeedType, SphinxNeed } from '../types';
import { hasCircumventTrees } from './attackTreeService';

export type LayoutDirection = 'TB' | 'LR'; // Top-to-Bottom or Left-to-Right

export interface LayoutOptions {
    nodeWidth: number;
    nodeHeight: number;
    horizontalGap: number;
    verticalGap: number;
}

/**
 * Get all nodes in a tree starting from a root node
 */
export const getTreeNodes = (rootId: string, allNeeds: SphinxNeed[]): SphinxNeed[] => {
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

/**
 * Calculate the actual height of a node based on its content
 */
export const getNodeHeight = (need: SphinxNeed, allNeeds: SphinxNeed[], baseHeight: number): number => {
    const isAttackRoot = need.tags.includes('attack-root');
    const isCircumventRoot = need.tags.includes('circumvent-root');
    const isRoot = isAttackRoot || isCircumventRoot;
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

/**
 * Check if two nodes overlap based on their positions and dimensions
 */
export const checkOverlap = (
    pos1: { x: number; y: number },
    pos2: { x: number; y: number },
    width: number,
    height1: number,
    height2: number
): boolean => {
    const avgHeight = (height1 + height2) / 2;
    return Math.abs(pos1.x - pos2.x) < width && Math.abs(pos1.y - pos2.y) < avgHeight;
};

/**
 * Apply auto layout to a tree of nodes
 */
export const getLayoutedElements = (
    rootId: string,
    allNeeds: SphinxNeed[],
    options: LayoutOptions,
    direction: LayoutDirection = 'TB'
): SphinxNeed[] => {
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
    const queue: { id: string; rank: number }[] = [{ id: rootId, rank: 0 }];
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

    const layoutWithSpacing = (hGap: number, vGap: number): Map<string, { x: number; y: number }> => {
        const positions = new Map<string, { x: number; y: number }>();

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
