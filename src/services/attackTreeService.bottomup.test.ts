import { describe, expect, it } from 'vitest';
import { AttackPotentialTuple, NeedType, SphinxNeed } from '../types';
import { calculateAttackTreeMetrics } from './attackTreeService';

// Helper to create a mock need
const createNeed = (
    id: string,
    type: NeedType = NeedType.ATTACK,
    links: string[] = [],
    logic_gate?: 'AND' | 'OR',
    attackPotential?: AttackPotentialTuple,
    tags: string[] = []
): SphinxNeed => ({
    id,
    title: `Title for ${id}`,
    description: `Description for ${id}`,
    type,
    status: 'open',
    tags,
    links,
    logic_gate,
    attackPotential,
    extra_data: {},
    content: '',
    docname: 'test',
    doctype: 'test',
    full_title: `Title for ${id}`,
    is_part_of: [],
    is_need: true,
    line: 1,
    section_name: 'test',
});

describe('Attack Tree Service - Bottom Up Calculation', () => {
    it('should calculate AP for a single leaf node', () => {
        const leaf = createNeed('leaf1', NeedType.ATTACK, [], undefined, {
            time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1
        });

        // Sum = 5. AP = 5.
        const metrics = calculateAttackTreeMetrics('leaf1', [leaf]);

        expect(metrics).not.toBeNull();
        expect(metrics?.attackPotential).toBe(5);
        expect(metrics?.criticalPaths).toHaveLength(1);
        expect(metrics?.criticalPaths[0]).toEqual(['leaf1']);
    });

    it('should calculate AP for an AND gate (Max of children)', () => {
        // Child 1: Time=5, others=1. AP=9
        const child1 = createNeed('child1', NeedType.ATTACK, [], undefined, {
            time: 5, expertise: 1, knowledge: 1, access: 1, equipment: 1
        });
        // Child 2: Expertise=5, others=1. AP=9
        const child2 = createNeed('child2', NeedType.ATTACK, [], undefined, {
            time: 1, expertise: 5, knowledge: 1, access: 1, equipment: 1
        });

        // Parent AND: Should take max of each attribute.
        // Time=5, Expertise=5, Knowledge=1, Access=1, Equipment=1.
        // Sum = 13.
        const parent = createNeed('parent', NeedType.ATTACK, ['child1', 'child2'], 'AND', undefined, ['attack-root']);

        const metrics = calculateAttackTreeMetrics('parent', [parent, child1, child2]);

        expect(metrics).not.toBeNull();
        expect(metrics?.attackPotential).toBe(13);
        expect(metrics?.criticalPaths[0]).toEqual(['parent', 'child1', 'child2']); // Order might vary depending on implementation but set should be same
    });

    it('should calculate AP for an OR gate (Min of children)', () => {
        // Child 1: Sum=5
        const child1 = createNeed('child1', NeedType.ATTACK, [], undefined, {
            time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1
        });
        // Child 2: Sum=10
        const child2 = createNeed('child2', NeedType.ATTACK, [], undefined, {
            time: 2, expertise: 2, knowledge: 2, access: 2, equipment: 2
        });

        // Parent OR: Should take min AP child -> Child 1.
        const parent = createNeed('parent', NeedType.ATTACK, ['child1', 'child2'], 'OR', undefined, ['attack-root']);

        const metrics = calculateAttackTreeMetrics('parent', [parent, child1, child2]);

        expect(metrics).not.toBeNull();
        expect(metrics?.attackPotential).toBe(5);
        expect(metrics?.criticalPaths).toHaveLength(1);
        expect(metrics?.criticalPaths[0]).toEqual(['parent', 'child1']);
    });

    it('should handle OR gate ties (include all min paths)', () => {
        // Child 1: Sum=5
        const child1 = createNeed('child1', NeedType.ATTACK, [], undefined, {
            time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1
        });
        // Child 2: Sum=5
        const child2 = createNeed('child2', NeedType.ATTACK, [], undefined, {
            time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1
        });

        const parent = createNeed('parent', NeedType.ATTACK, ['child1', 'child2'], 'OR', undefined, ['attack-root']);

        const metrics = calculateAttackTreeMetrics('parent', [parent, child1, child2]);

        expect(metrics).not.toBeNull();
        expect(metrics?.attackPotential).toBe(5);
        expect(metrics?.criticalPaths).toHaveLength(2);
        // Check that we have both paths
        const paths = metrics?.criticalPaths.map(p => p.sort().join(','));
        expect(paths).toContain('child1,parent');
        expect(paths).toContain('child2,parent');
    });

    it('should handle nested structures (AND of ORs)', () => {
        // OR Gate 1: Min is 5
        const leaf1a = createNeed('leaf1a', NeedType.ATTACK, [], undefined, { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 }); // 5
        const leaf1b = createNeed('leaf1b', NeedType.ATTACK, [], undefined, { time: 10, expertise: 1, knowledge: 1, access: 1, equipment: 1 }); // 14
        const or1 = createNeed('or1', NeedType.ATTACK, ['leaf1a', 'leaf1b'], 'OR');

        // OR Gate 2: Min is 5
        const leaf2a = createNeed('leaf2a', NeedType.ATTACK, [], undefined, { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 }); // 5
        const leaf2b = createNeed('leaf2b', NeedType.ATTACK, [], undefined, { time: 10, expertise: 1, knowledge: 1, access: 1, equipment: 1 }); // 14
        const or2 = createNeed('or2', NeedType.ATTACK, ['leaf2a', 'leaf2b'], 'OR');

        // Root AND: Max(OR1_Min_Tuple, OR2_Min_Tuple)
        // Both tuples are {1,1,1,1,1}. Max is {1,1,1,1,1}. Sum = 5.
        const root = createNeed('root', NeedType.ATTACK, ['or1', 'or2'], 'AND', undefined, ['attack-root']);

        const metrics = calculateAttackTreeMetrics('root', [root, or1, or2, leaf1a, leaf1b, leaf2a, leaf2b]);

        expect(metrics).not.toBeNull();
        expect(metrics?.attackPotential).toBe(5);
        expect(metrics?.criticalPaths[0].sort()).toEqual(['leaf1a', 'leaf2a', 'or1', 'or2', 'root'].sort());
    });
});
