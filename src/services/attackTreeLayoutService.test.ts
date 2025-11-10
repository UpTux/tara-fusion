import { describe, expect, it } from 'vitest';
import { NeedStatus, NeedType, SphinxNeed } from '../types';
import {
    checkOverlap,
    getLayoutedElements,
    getNodeHeight,
    getTreeNodes
} from './attackTreeLayoutService';

// Helper to create test needs with required fields
const createNeed = (partial: Partial<SphinxNeed> & { id: string }): SphinxNeed => ({
    type: NeedType.ATTACK,
    title: '',
    description: '',
    tags: [],
    status: NeedStatus.OPEN,
    links: [],
    ...partial
});

describe('attackTreeLayoutService', () => {
    describe('getTreeNodes', () => {
        it('should return only the root node when there are no links', () => {
            const needs: SphinxNeed[] = [
                createNeed({ id: 'root', title: 'Root', tags: ['attack-root'] })
            ];

            const result = getTreeNodes('root', needs);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('root');
        });

        it('should return all connected nodes in a tree', () => {
            const needs: SphinxNeed[] = [
                createNeed({ id: 'root', title: 'Root', tags: ['attack-root'], links: ['child1', 'child2'] }),
                createNeed({ id: 'child1', title: 'Child 1', links: ['grandchild1'] }),
                createNeed({ id: 'child2', title: 'Child 2' }),
                createNeed({ id: 'grandchild1', title: 'Grandchild 1' }),
                createNeed({ id: 'unrelated', title: 'Unrelated' })
            ];

            const result = getTreeNodes('root', needs);
            expect(result).toHaveLength(4);
            const ids = result.map(n => n.id);
            expect(ids).toContain('root');
            expect(ids).toContain('child1');
            expect(ids).toContain('child2');
            expect(ids).toContain('grandchild1');
            expect(ids).not.toContain('unrelated');
        });

        it('should handle circular references without infinite loop', () => {
            const needs: SphinxNeed[] = [
                createNeed({ id: 'node1', title: 'Node 1', links: ['node2'] }),
                createNeed({ id: 'node2', title: 'Node 2', links: ['node1'] })
            ];

            const result = getTreeNodes('node1', needs);
            expect(result).toHaveLength(2);
        });

        it('should return empty array when root does not exist', () => {
            const needs: SphinxNeed[] = [
                createNeed({ id: 'other', title: 'Other' })
            ];

            const result = getTreeNodes('nonexistent', needs);
            expect(result).toHaveLength(0);
        });
    });

    describe('getNodeHeight', () => {
        const baseHeight = 150;

        it('should return base height + 180 for leaf nodes', () => {
            const leaf = createNeed({ id: 'leaf1', title: 'Leaf' });

            const height = getNodeHeight(leaf, [leaf], baseHeight);
            expect(height).toBe(baseHeight + 180);
        });

        it('should return base height + 120 for attack-root with circumvent trees', () => {
            const root = createNeed({
                id: 'root',
                title: 'Root',
                tags: ['attack-root'],
                logic_gate: 'OR',
                links: ['circumvent']
            });

            const circumvent = createNeed({
                id: 'circumvent',
                title: 'Circumvent',
                tags: ['circumvent-root']
            });

            const height = getNodeHeight(root, [root, circumvent], baseHeight);
            expect(height).toBe(baseHeight + 120);
        });

        it('should return base height for attack-root without circumvent trees', () => {
            const root = createNeed({
                id: 'root',
                title: 'Root',
                tags: ['attack-root'],
                logic_gate: 'OR'
            });

            const height = getNodeHeight(root, [root], baseHeight);
            expect(height).toBe(baseHeight);
        });

        it('should return base height for intermediate nodes', () => {
            const intermediate = createNeed({
                id: 'intermediate',
                title: 'Intermediate',
                logic_gate: 'AND'
            });

            const height = getNodeHeight(intermediate, [intermediate], baseHeight);
            expect(height).toBe(baseHeight);
        });

        it('should return base height for circumvent-root nodes', () => {
            const circumventRoot = createNeed({
                id: 'circumvent',
                title: 'Circumvent Root',
                tags: ['circumvent-root']
            });

            const height = getNodeHeight(circumventRoot, [circumventRoot], baseHeight);
            expect(height).toBe(baseHeight);
        });

        it('should not treat node with logic_gate as leaf', () => {
            const notLeaf = createNeed({
                id: 'not-leaf',
                title: 'Not a leaf',
                logic_gate: 'OR'
            });

            const height = getNodeHeight(notLeaf, [notLeaf], baseHeight);
            expect(height).toBe(baseHeight);
        });

        it('should not treat root as leaf even without logic_gate', () => {
            const root = createNeed({
                id: 'root',
                title: 'Root',
                tags: ['attack-root']
            });

            const height = getNodeHeight(root, [root], baseHeight);
            expect(height).toBe(baseHeight);
        });
    });

    describe('checkOverlap', () => {
        it('should detect overlap when nodes are too close horizontally', () => {
            const pos1 = { x: 0, y: 0 };
            const pos2 = { x: 100, y: 0 };
            const width = 256;
            const height1 = 150;
            const height2 = 150;

            const result = checkOverlap(pos1, pos2, width, height1, height2);
            expect(result).toBe(true);
        });

        it('should detect overlap when nodes are too close vertically', () => {
            const pos1 = { x: 0, y: 0 };
            const pos2 = { x: 0, y: 100 };
            const width = 256;
            const height1 = 150;
            const height2 = 150;

            const result = checkOverlap(pos1, pos2, width, height1, height2);
            expect(result).toBe(true);
        });

        it('should not detect overlap when nodes are far apart', () => {
            const pos1 = { x: 0, y: 0 };
            const pos2 = { x: 500, y: 500 };
            const width = 256;
            const height1 = 150;
            const height2 = 150;

            const result = checkOverlap(pos1, pos2, width, height1, height2);
            expect(result).toBe(false);
        });

        it('should handle different node heights correctly', () => {
            const pos1 = { x: 0, y: 0 };
            const pos2 = { x: 0, y: 200 };
            const width = 256;
            const height1 = 330;
            const height2 = 150;

            const result = checkOverlap(pos1, pos2, width, height1, height2);
            expect(result).toBe(true);
        });

        it('should not detect overlap when nodes have large heights but sufficient vertical distance', () => {
            const pos1 = { x: 0, y: 0 };
            const pos2 = { x: 0, y: 300 };
            const width = 256;
            const height1 = 330;
            const height2 = 150;

            const result = checkOverlap(pos1, pos2, width, height1, height2);
            expect(result).toBe(false);
        });
    });

    describe('getLayoutedElements - TB (Top-to-Bottom)', () => {
        const options = {
            nodeWidth: 256,
            nodeHeight: 150,
            horizontalGap: 80,
            verticalGap: 100
        };

        it('should layout a single node at origin (centered)', () => {
            const needs: SphinxNeed[] = [
                createNeed({ id: 'root', title: 'Root', tags: ['attack-root'] })
            ];

            const result = getLayoutedElements('root', needs, options, 'TB');
            expect(result).toHaveLength(1);
            // Single node is centered, so X is -half of nodeWidth
            expect(result[0].position).toEqual({ x: -128, y: 0 });
        });

        it('should layout parent and single child vertically', () => {
            const needs: SphinxNeed[] = [
                createNeed({
                    id: 'root',
                    title: 'Root',
                    tags: ['attack-root'],
                    logic_gate: 'OR',
                    links: ['child']
                }),
                createNeed({ id: 'child', title: 'Child' })
            ];

            const result = getLayoutedElements('root', needs, options, 'TB');
            const root = result.find(n => n.id === 'root');
            const child = result.find(n => n.id === 'child');

            expect(root?.position?.y).toBe(0);
            expect(child?.position?.y).toBeGreaterThan(0);
            // Single child is centered like root
            expect(child?.position?.x).toBe(-128);
        });

        it('should layout multiple children horizontally in the same rank', () => {
            const needs: SphinxNeed[] = [
                createNeed({
                    id: 'root',
                    title: 'Root',
                    tags: ['attack-root'],
                    logic_gate: 'OR',
                    links: ['child1', 'child2']
                }),
                createNeed({ id: 'child1', title: 'Child 1' }),
                createNeed({ id: 'child2', title: 'Child 2' })
            ];

            const result = getLayoutedElements('root', needs, options, 'TB');
            const child1 = result.find(n => n.id === 'child1');
            const child2 = result.find(n => n.id === 'child2');

            expect(child1?.position?.y).toBe(child2?.position?.y);
            expect(Math.abs((child1?.position?.x || 0) - (child2?.position?.x || 0))).toBeGreaterThan(0);
        });

        it('should use increased height for leaf nodes', () => {
            const needs: SphinxNeed[] = [
                createNeed({
                    id: 'root',
                    title: 'Root',
                    tags: ['attack-root'],
                    logic_gate: 'OR',
                    links: ['leaf']
                }),
                createNeed({ id: 'leaf', title: 'Leaf' })
            ];

            const result = getLayoutedElements('root', needs, options, 'TB');
            const leaf = result.find(n => n.id === 'leaf');

            const expectedY = options.nodeHeight + options.verticalGap;
            expect(leaf?.position?.y).toBe(expectedY);
        });

        it('should layout a deep tree with multiple levels', () => {
            const needs: SphinxNeed[] = [
                createNeed({
                    id: 'root',
                    title: 'Root',
                    tags: ['attack-root'],
                    logic_gate: 'OR',
                    links: ['level1']
                }),
                createNeed({
                    id: 'level1',
                    title: 'Level 1',
                    logic_gate: 'AND',
                    links: ['level2']
                }),
                createNeed({ id: 'level2', title: 'Level 2' })
            ];

            const result = getLayoutedElements('root', needs, options, 'TB');
            const root = result.find(n => n.id === 'root');
            const level1 = result.find(n => n.id === 'level1');
            const level2 = result.find(n => n.id === 'level2');

            expect(root?.position?.y).toBeLessThan(level1?.position?.y || 0);
            expect(level1?.position?.y).toBeLessThan(level2?.position?.y || 0);
        });
    });

    describe('getLayoutedElements - LR (Left-to-Right)', () => {
        const options = {
            nodeWidth: 256,
            nodeHeight: 150,
            horizontalGap: 80,
            verticalGap: 100
        };

        it('should layout a single node at origin (centered)', () => {
            const needs: SphinxNeed[] = [
                createNeed({ id: 'root', title: 'Root', tags: ['attack-root'] })
            ];

            const result = getLayoutedElements('root', needs, options, 'LR');
            expect(result).toHaveLength(1);
            // Single node is centered, so Y is -half of nodeHeight
            expect(result[0].position).toEqual({ x: 0, y: -75 });
        });

        it('should layout parent and child horizontally', () => {
            const needs: SphinxNeed[] = [
                createNeed({
                    id: 'root',
                    title: 'Root',
                    tags: ['attack-root'],
                    logic_gate: 'OR',
                    links: ['child']
                }),
                createNeed({ id: 'child', title: 'Child' })
            ];

            const result = getLayoutedElements('root', needs, options, 'LR');
            const root = result.find(n => n.id === 'root');
            const child = result.find(n => n.id === 'child');

            expect(root?.position?.x).toBe(0);
            expect(child?.position?.x).toBeGreaterThan(0);
            // Child is a leaf, height = 330, so y = -165
            expect(child?.position?.y).toBe(-165);
        });

        it('should layout multiple children vertically in the same rank', () => {
            const needs: SphinxNeed[] = [
                createNeed({
                    id: 'root',
                    title: 'Root',
                    tags: ['attack-root'],
                    logic_gate: 'OR',
                    links: ['child1', 'child2']
                }),
                createNeed({ id: 'child1', title: 'Child 1' }),
                createNeed({ id: 'child2', title: 'Child 2' })
            ];

            const result = getLayoutedElements('root', needs, options, 'LR');
            const child1 = result.find(n => n.id === 'child1');
            const child2 = result.find(n => n.id === 'child2');

            expect(child1?.position?.x).toBe(child2?.position?.x);
            expect(Math.abs((child1?.position?.y || 0) - (child2?.position?.y || 0))).toBeGreaterThan(0);
        });

        it('should handle different node heights in LR layout', () => {
            const needs: SphinxNeed[] = [
                createNeed({
                    id: 'root',
                    title: 'Root',
                    tags: ['attack-root'],
                    logic_gate: 'OR',
                    links: ['leaf1', 'intermediate']
                }),
                createNeed({ id: 'leaf1', title: 'Leaf 1' }),
                createNeed({
                    id: 'intermediate',
                    title: 'Intermediate',
                    logic_gate: 'AND'
                })
            ];

            const result = getLayoutedElements('root', needs, options, 'LR');
            const leaf1 = result.find(n => n.id === 'leaf1');
            const intermediate = result.find(n => n.id === 'intermediate');

            expect(leaf1?.position?.x).toBe(intermediate?.position?.x);
            expect(leaf1?.position?.y).not.toBe(intermediate?.position?.y);

            const spacing = Math.abs((leaf1?.position?.y || 0) - (intermediate?.position?.y || 0));
            expect(spacing).toBeGreaterThan(options.verticalGap);
        });
    });

    describe('getLayoutedElements - Edge Cases', () => {
        const options = {
            nodeWidth: 256,
            nodeHeight: 150,
            horizontalGap: 80,
            verticalGap: 100
        };

        it('should handle nodes not in the tree', () => {
            const needs: SphinxNeed[] = [
                createNeed({ id: 'root', title: 'Root', tags: ['attack-root'], links: ['child'] }),
                createNeed({ id: 'child', title: 'Child' }),
                createNeed({ id: 'unrelated', title: 'Unrelated' })
            ];

            const result = getLayoutedElements('root', needs, options, 'TB');

            const root = result.find(n => n.id === 'root');
            const child = result.find(n => n.id === 'child');
            expect(root?.position).toBeDefined();
            expect(child?.position).toBeDefined();

            const unrelated = result.find(n => n.id === 'unrelated');
            expect(unrelated).toBeDefined();
        });

        it('should preserve existing positions for nodes outside the tree', () => {
            const needs: SphinxNeed[] = [
                createNeed({ id: 'root', title: 'Root', tags: ['attack-root'] }),
                createNeed({ id: 'other', title: 'Other', position: { x: 999, y: 999 } })
            ];

            const result = getLayoutedElements('root', needs, options, 'TB');

            const other = result.find(n => n.id === 'other');
            expect(other?.position).toEqual({ x: 999, y: 999 });
        });

        it('should increase spacing when overlap is detected', () => {
            // Create a tree that will trigger overlap detection
            // Many children with minimal gaps to force spacing increase
            const needs: SphinxNeed[] = [
                createNeed({
                    id: 'root',
                    title: 'Root',
                    tags: ['attack-root'],
                    logic_gate: 'OR',
                    links: ['child1', 'child2', 'child3', 'child4', 'child5']
                }),
                createNeed({ id: 'child1', title: 'Child 1' }),
                createNeed({ id: 'child2', title: 'Child 2' }),
                createNeed({ id: 'child3', title: 'Child 3' }),
                createNeed({ id: 'child4', title: 'Child 4' }),
                createNeed({ id: 'child5', title: 'Child 5' })
            ];

            // Use very small gaps to trigger overlap
            const tightOptions = {
                nodeWidth: 256,
                nodeHeight: 150,
                horizontalGap: 10,  // Very small to trigger overlap
                verticalGap: 10
            };

            const result = getLayoutedElements('root', needs, tightOptions, 'TB');

            // Verify all nodes are positioned
            expect(result).toHaveLength(6);

            // Children should have different X positions (spread out)
            const children = result.filter(n => n.id.startsWith('child'));
            const xPositions = children.map(c => c.position?.x).filter(x => x !== undefined);
            const uniqueXPositions = new Set(xPositions);
            expect(uniqueXPositions.size).toBe(5);
        });
    });
});