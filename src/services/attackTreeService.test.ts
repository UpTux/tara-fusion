import { describe, it, expect } from 'vitest';
import {
    calculateAttackTreeMetrics,
    traceCriticalPaths,
    hasCircumventTrees,
    findParentNodesOfCircumventTree,
    isNodeInCircumventSubtree,
    calculateNodeMetrics,
} from './attackTreeService';
import { NeedType, SphinxNeed, ToeConfiguration, AttackPotentialTuple } from '../types';

describe('attackTreeService', () => {
    // Helper function to create a basic attack node
    const createAttackNode = (
        id: string,
        links: string[] = [],
        attackPotential?: AttackPotentialTuple,
        logic_gate?: 'AND' | 'OR',
        tags: string[] = [],
        toeConfigurationIds?: string[]
    ): SphinxNeed => ({
        id,
        type: NeedType.ATTACK,
        title: `Attack ${id}`,
        description: `Description for ${id}`,
        status: 'open' as any,
        tags,
        links,
        logic_gate,
        attackPotential,
        toeConfigurationIds,
    });

    describe('calculateAttackTreeMetrics', () => {
        it('should calculate AP for simple single-path tree', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['leaf1'], undefined, undefined, ['attack-root']),
                createAttackNode('leaf1', [], { time: 2, expertise: 3, knowledge: 2, access: 2, equipment: 2 }),
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(11); // 2+3+2+2+2
            expect(result!.criticalPaths).toHaveLength(1);
            expect(result!.criticalPaths[0]).toEqual(['leaf1']);
        });

        it('should return null for tree with no paths', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', [], undefined, undefined, ['attack-root']),
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).toBeNull();
        });

        it('should handle OR gate and find minimum AP path', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['child1', 'child2'], undefined, 'OR', ['attack-root']),
                createAttackNode('child1', [], { time: 5, expertise: 5, knowledge: 5, access: 5, equipment: 5 }), // AP = 25
                createAttackNode('child2', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }), // AP = 10
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(10); // Minimum of the two paths
            expect(result!.criticalPaths).toHaveLength(1);
            expect(result!.criticalPaths[0]).toEqual(['child2']);
        });

        it('should handle AND gate and combine path requirements', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['child1', 'child2'], undefined, 'AND', ['attack-root']),
                createAttackNode('child1', [], { time: 3, expertise: 2, knowledge: 1, access: 1, equipment: 1 }), // AP = 8
                createAttackNode('child2', [], { time: 2, expertise: 4, knowledge: 3, access: 2, equipment: 1 }), // AP = 12
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            // AND gate should take max of each dimension: max(3,2), max(2,4), max(1,3), max(1,2), max(1,1)
            // Result: 3+4+3+2+1 = 13
            expect(result!.attackPotential).toBe(13);
            expect(result!.criticalPaths).toHaveLength(1);
        });

        it('should handle complex tree with nested gates', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['or1', 'or2'], undefined, 'OR', ['attack-root']),
                createAttackNode('or1', ['and1'], undefined, 'OR'),
                createAttackNode('or2', ['leaf3'], undefined, 'OR'),
                createAttackNode('and1', ['leaf1', 'leaf2'], undefined, 'AND'),
                createAttackNode('leaf1', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }), // AP = 10
                createAttackNode('leaf2', [], { time: 3, expertise: 3, knowledge: 3, access: 3, equipment: 3 }), // AP = 15
                createAttackNode('leaf3', [], { time: 5, expertise: 5, knowledge: 5, access: 5, equipment: 5 }), // AP = 25
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            // AND gate: max(2,3), max(2,3), max(2,3), max(2,3), max(2,3) = 3+3+3+3+3 = 15
            // OR gate: min(15, 25) = 15
            expect(result!.attackPotential).toBe(15);
        });

        it('should handle multiple critical paths with same AP', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['child1', 'child2'], undefined, 'OR', ['attack-root']),
                createAttackNode('child1', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }), // AP = 10
                createAttackNode('child2', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }), // AP = 10
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(10);
            expect(result!.criticalPaths).toHaveLength(2);
        });

        it('should handle infeasible attack paths', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['leaf1'], undefined, undefined, ['attack-root']),
                createAttackNode('leaf1', [], { time: 99, expertise: 2, knowledge: 2, access: 2, equipment: 2 }), // Infeasible
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(99); // Infeasible marker
        });

        it('should filter nodes based on TOE configuration', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['child1', 'child2'], undefined, 'OR', ['attack-root']),
                createAttackNode('child1', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }, undefined, [], ['toe1']), // AP = 10
                createAttackNode('child2', [], { time: 5, expertise: 5, knowledge: 5, access: 5, equipment: 5 }), // AP = 25
            ];

            const toeConfigs: ToeConfiguration[] = [
                {
                    active: false, // child1 should be filtered out
                    id: 'toe1',
                    name: 'TOE Config 1',
                    description: '',
                    comment: '',
                },
            ];

            const result = calculateAttackTreeMetrics('root', needs, toeConfigs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(25); // Only child2 path remains
        });

        it('should include nodes when TOE configuration is active', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['child1'], undefined, undefined, ['attack-root']),
                createAttackNode('child1', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }, undefined, [], ['toe1']),
            ];

            const toeConfigs: ToeConfiguration[] = [
                {
                    active: true,
                    id: 'toe1',
                    name: 'TOE Config 1',
                    description: '',
                    comment: '',
                },
            ];

            const result = calculateAttackTreeMetrics('root', needs, toeConfigs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(10);
        });

        it('should exclude circumvent trees when includeCircumventTrees is false', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['normal', 'circumvent'], undefined, 'OR', ['attack-root']),
                createAttackNode('normal', [], { time: 3, expertise: 3, knowledge: 3, access: 3, equipment: 3 }), // AP = 15
                createAttackNode('circumvent', ['circumvent-leaf'], undefined, undefined, ['circumvent-root']),
                createAttackNode('circumvent-leaf', [], { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 }), // AP = 5
            ];

            const result = calculateAttackTreeMetrics('root', needs, [], false);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(15); // Circumvent tree excluded
        });

        it('should include circumvent trees when includeCircumventTrees is true', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['normal', 'circumvent'], undefined, 'OR', ['attack-root']),
                createAttackNode('normal', [], { time: 3, expertise: 3, knowledge: 3, access: 3, equipment: 3 }), // AP = 15
                createAttackNode('circumvent', [], { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 }, undefined, ['circumvent-root']), // Make it a leaf node
            ];

            const result = calculateAttackTreeMetrics('root', needs, [], true);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(5); // Circumvent tree included, lower AP wins
        });

        it('should handle empty needs array', () => {
            const result = calculateAttackTreeMetrics('root', []);

            expect(result).toBeNull();
        });

        it('should handle nonexistent root node', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('leaf1', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }),
            ];

            const result = calculateAttackTreeMetrics('nonexistent', needs);

            expect(result).toBeNull();
        });
    });

    describe('traceCriticalPaths', () => {
        it('should trace nodes from leaves to root', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['middle'], undefined, undefined, ['attack-root']),
                createAttackNode('middle', ['leaf1', 'leaf2'], undefined, 'AND'),
                createAttackNode('leaf1', []),
                createAttackNode('leaf2', []),
            ];

            const criticalLeafSets = [['leaf1', 'leaf2']];
            const criticalNodes = traceCriticalPaths('root', criticalLeafSets, needs);

            expect(criticalNodes.has('leaf1')).toBe(true);
            expect(criticalNodes.has('leaf2')).toBe(true);
            expect(criticalNodes.has('middle')).toBe(true);
            expect(criticalNodes.has('root')).toBe(true);
        });

        it('should handle multiple critical paths', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['child1', 'child2'], undefined, 'OR'),
                createAttackNode('child1', ['leaf1']),
                createAttackNode('child2', ['leaf2']),
                createAttackNode('leaf1', []),
                createAttackNode('leaf2', []),
            ];

            const criticalLeafSets = [['leaf1'], ['leaf2']];
            const criticalNodes = traceCriticalPaths('root', criticalLeafSets, needs);

            expect(criticalNodes.has('leaf1')).toBe(true);
            expect(criticalNodes.has('leaf2')).toBe(true);
            expect(criticalNodes.has('child1')).toBe(true);
            expect(criticalNodes.has('child2')).toBe(true);
            expect(criticalNodes.has('root')).toBe(true);
        });

        it('should handle empty critical leaf sets', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['leaf1']),
                createAttackNode('leaf1', []),
            ];

            const criticalNodes = traceCriticalPaths('root', [], needs);

            expect(criticalNodes.size).toBe(0);
        });

        it('should handle complex branching structure', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['a', 'b']),
                createAttackNode('a', ['c']),
                createAttackNode('b', ['c', 'd']),
                createAttackNode('c', ['leaf1']),
                createAttackNode('d', ['leaf2']),
                createAttackNode('leaf1', []),
                createAttackNode('leaf2', []),
            ];

            const criticalLeafSets = [['leaf1']];
            const criticalNodes = traceCriticalPaths('root', criticalLeafSets, needs);

            expect(criticalNodes.has('leaf1')).toBe(true);
            expect(criticalNodes.has('c')).toBe(true);
            expect(criticalNodes.has('a')).toBe(true);
            expect(criticalNodes.has('b')).toBe(true);
            expect(criticalNodes.has('root')).toBe(true);
        });
    });

    describe('hasCircumventTrees', () => {
        it('should return true when node has circumvent tree children', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('parent', ['child1', 'circumvent']),
                createAttackNode('child1', []),
                createAttackNode('circumvent', [], undefined, undefined, ['circumvent-root']),
            ];

            const result = hasCircumventTrees('parent', needs);

            expect(result).toBe(true);
        });

        it('should return false when node has no circumvent tree children', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('parent', ['child1', 'child2']),
                createAttackNode('child1', []),
                createAttackNode('child2', []),
            ];

            const result = hasCircumventTrees('parent', needs);

            expect(result).toBe(false);
        });

        it('should return false for leaf nodes', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('leaf', []),
            ];

            const result = hasCircumventTrees('leaf', needs);

            expect(result).toBe(false);
        });

        it('should return false for nonexistent nodes', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('node1', []),
            ];

            const result = hasCircumventTrees('nonexistent', needs);

            expect(result).toBe(false);
        });
    });

    describe('findParentNodesOfCircumventTree', () => {
        it('should find all parent nodes linking to circumvent tree root', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('parent1', ['circumvent-root']),
                createAttackNode('parent2', ['circumvent-root', 'other']),
                createAttackNode('other', []),
                createAttackNode('circumvent-root', [], undefined, undefined, ['circumvent-root']),
            ];

            const parents = findParentNodesOfCircumventTree('circumvent-root', needs);

            expect(parents).toHaveLength(2);
            expect(parents).toContain('parent1');
            expect(parents).toContain('parent2');
        });

        it('should return empty array when no parents exist', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('circumvent-root', [], undefined, undefined, ['circumvent-root']),
                createAttackNode('other', []),
            ];

            const parents = findParentNodesOfCircumventTree('circumvent-root', needs);

            expect(parents).toHaveLength(0);
        });

        it('should return empty array for nonexistent circumvent tree', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('node1', ['node2']),
                createAttackNode('node2', []),
            ];

            const parents = findParentNodesOfCircumventTree('nonexistent', needs);

            expect(parents).toHaveLength(0);
        });
    });

    describe('isNodeInCircumventSubtree', () => {
        it('should return true for circumvent tree root', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('circumvent-root', ['child'], undefined, undefined, ['circumvent-root']),
                createAttackNode('child', []),
            ];

            const result = isNodeInCircumventSubtree('circumvent-root', needs);

            expect(result).toBe(true);
        });

        it('should return true for descendants of circumvent tree root', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('circumvent-root', ['child1'], undefined, undefined, ['circumvent-root']),
                createAttackNode('child1', ['child2']),
                createAttackNode('child2', []),
            ];

            expect(isNodeInCircumventSubtree('child1', needs)).toBe(true);
            expect(isNodeInCircumventSubtree('child2', needs)).toBe(true);
        });

        it('should return false for nodes outside circumvent tree', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['normal', 'circumvent-root'], undefined, undefined, ['attack-root']),
                createAttackNode('normal', ['normal-child']),
                createAttackNode('normal-child', []),
                createAttackNode('circumvent-root', ['circumvent-child'], undefined, undefined, ['circumvent-root']),
                createAttackNode('circumvent-child', []),
            ];

            expect(isNodeInCircumventSubtree('root', needs)).toBe(false);
            expect(isNodeInCircumventSubtree('normal', needs)).toBe(false);
            expect(isNodeInCircumventSubtree('normal-child', needs)).toBe(false);
        });

        it('should return false for nonexistent nodes', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('node1', []),
            ];

            const result = isNodeInCircumventSubtree('nonexistent', needs);

            expect(result).toBe(false);
        });

        it('should handle multiple circumvent trees', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('circumvent1', ['c1-child'], undefined, undefined, ['circumvent-root']),
                createAttackNode('c1-child', []),
                createAttackNode('circumvent2', ['c2-child'], undefined, undefined, ['circumvent-root']),
                createAttackNode('c2-child', []),
            ];

            expect(isNodeInCircumventSubtree('c1-child', needs)).toBe(true);
            expect(isNodeInCircumventSubtree('c2-child', needs)).toBe(true);
        });
    });

    describe('calculateNodeMetrics', () => {
        it('should calculate metrics for intermediate node', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('node', ['leaf1', 'leaf2'], undefined, 'AND'),
                createAttackNode('leaf1', [], { time: 2, expertise: 3, knowledge: 2, access: 2, equipment: 2 }),
                createAttackNode('leaf2', [], { time: 3, expertise: 2, knowledge: 3, access: 3, equipment: 3 }),
            ];

            const result = calculateNodeMetrics('node', needs);

            expect(result).not.toBeNull();
            expect(result!.hasSubtree).toBe(true);
            expect(result!.attackPotential).toBe(15); // max(2,3) + max(3,2) + max(2,3) + max(2,3) + max(2,3) = 3+3+3+3+3
            expect(result!.attackPotentialTuple).toEqual({
                time: 3,
                expertise: 3,
                knowledge: 3,
                access: 3,
                equipment: 3,
            });
        });

        it('should return null for non-attack nodes', () => {
            const needs: SphinxNeed[] = [
                {
                    id: 'req1',
                    type: NeedType.REQUIREMENT,
                    title: 'Requirement',
                    description: '',
                    status: 'open' as any,
                    tags: [],
                    links: [],
                },
            ];

            const result = calculateNodeMetrics('req1', needs);

            expect(result).toBeNull();
        });

        it('should return Infinity AP for node with no valid paths', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('node', [], undefined, 'AND'),
            ];

            const result = calculateNodeMetrics('node', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(Infinity);
            expect(result!.hasSubtree).toBe(false);
        });

        it('should handle OR gate and find minimum path', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('node', ['leaf1', 'leaf2'], undefined, 'OR'),
                createAttackNode('leaf1', [], { time: 5, expertise: 5, knowledge: 5, access: 5, equipment: 5 }), // AP = 25
                createAttackNode('leaf2', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }), // AP = 10
            ];

            const result = calculateNodeMetrics('node', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(10);
            expect(result!.attackPotentialTuple).toEqual({
                time: 2,
                expertise: 2,
                knowledge: 2,
                access: 2,
                equipment: 2,
            });
        });

        it('should respect TOE configurations', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('node', ['leaf1', 'leaf2'], undefined, 'OR'),
                createAttackNode('leaf1', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }, undefined, [], ['toe1']),
                createAttackNode('leaf2', [], { time: 5, expertise: 5, knowledge: 5, access: 5, equipment: 5 }),
            ];

            const toeConfigs: ToeConfiguration[] = [
                {
                    active: false,
                    id: 'toe1',
                    name: 'TOE Config 1',
                    description: '',
                    comment: '',
                },
            ];

            const result = calculateNodeMetrics('node', needs, toeConfigs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(25); // leaf1 filtered out
        });

        it('should exclude circumvent trees when includeCircumventTrees is false', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('node', ['normal', 'circumvent'], undefined, 'OR'),
                createAttackNode('normal', [], { time: 3, expertise: 3, knowledge: 3, access: 3, equipment: 3 }),
                createAttackNode('circumvent', [], { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 }, undefined, ['circumvent-root']),
            ];

            const result = calculateNodeMetrics('node', needs, [], false);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(15); // Circumvent excluded
        });

        it('should include circumvent trees when includeCircumventTrees is true', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('node', ['normal', 'circumvent'], undefined, 'OR'),
                createAttackNode('normal', [], { time: 3, expertise: 3, knowledge: 3, access: 3, equipment: 3 }),
                createAttackNode('circumvent', [], { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 }, undefined, ['circumvent-root']),
            ];

            const result = calculateNodeMetrics('node', needs, [], true);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(5); // Circumvent included
        });
    });

    describe('Edge cases and integration scenarios', () => {
        it('should handle deeply nested tree structure', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['l1'], undefined, undefined, ['attack-root']),
                createAttackNode('l1', ['l2'], undefined, 'OR'),
                createAttackNode('l2', ['l3'], undefined, 'OR'),
                createAttackNode('l3', ['l4'], undefined, 'OR'),
                createAttackNode('l4', ['leaf'], undefined, 'OR'),
                createAttackNode('leaf', [], { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 }),
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(5);
        });

        it('should handle tree with all infeasible paths', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['leaf1', 'leaf2'], undefined, 'OR', ['attack-root']),
                createAttackNode('leaf1', [], { time: 99, expertise: 1, knowledge: 1, access: 1, equipment: 1 }),
                createAttackNode('leaf2', [], { time: 1, expertise: 99, knowledge: 1, access: 1, equipment: 1 }),
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(99);
        });

        it('should handle mixed feasible and infeasible paths', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['leaf1', 'leaf2'], undefined, 'OR', ['attack-root']),
                createAttackNode('leaf1', [], { time: 99, expertise: 1, knowledge: 1, access: 1, equipment: 1 }), // Infeasible
                createAttackNode('leaf2', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }), // Feasible, AP = 10
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(10); // Should choose feasible path
        });

        it('should handle attack-root node with implicit AND logic', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['child1', 'child2'], undefined, undefined, ['attack-root']),
                createAttackNode('child1', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }),
                createAttackNode('child2', [], { time: 3, expertise: 3, knowledge: 3, access: 3, equipment: 3 }),
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            // Attack-root without explicit gate defaults to AND
            expect(result!.attackPotential).toBe(15); // max of each dimension
        });

        it('should handle shared leaf nodes in AND gate', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['leaf'], undefined, 'AND', ['attack-root']),
                createAttackNode('leaf', [], { time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2 }),
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(10);
            expect(result!.criticalPaths).toHaveLength(1);
            expect(result!.criticalPaths[0]).toEqual(['leaf']);
        });

        it('should handle empty attack potential', () => {
            const needs: SphinxNeed[] = [
                createAttackNode('root', ['leaf'], undefined, undefined, ['attack-root']),
                createAttackNode('leaf', [], undefined), // No attack potential specified
            ];

            const result = calculateAttackTreeMetrics('root', needs);

            expect(result).not.toBeNull();
            expect(result!.attackPotential).toBe(0); // Should default to 0
        });
    });
});
