import { describe, expect, it } from 'vitest';
import { AttackPotentialTuple, NeedStatus, NeedType, SphinxNeed } from '../types';
import { calculateAttackTreeMetrics } from './attackTreeService';

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
    status: NeedStatus.OPEN,
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

describe('Attack Tree Service - OR Gate Component-wise Minimum', () => {
    it('should calculate component-wise minimum for OR gate', () => {
        // Child 1: (1, 0, 3, 0, 0) -> AP = 4
        const child1 = createNeed('child1', NeedType.ATTACK, [], undefined, {
            time: 1, expertise: 0, knowledge: 3, access: 0, equipment: 0
        });

        // Child 2: (0, 0, 0, 5, 0) -> AP = 5
        const child2 = createNeed('child2', NeedType.ATTACK, [], undefined, {
            time: 0, expertise: 0, knowledge: 0, access: 5, equipment: 0
        });

        // Parent OR: 
        // Time: min(1, 0) = 0
        // Expertise: min(0, 0) = 0
        // Knowledge: min(3, 0) = 0
        // Access: min(0, 5) = 0
        // Equipment: min(0, 0) = 0
        // Result Tuple: (0, 0, 0, 0, 0) -> AP = 0
        const parent = createNeed('parent', NeedType.ATTACK, ['child1', 'child2'], 'OR', undefined, ['attack-root']);

        const metrics = calculateAttackTreeMetrics('parent', [parent, child1, child2]);

        expect(metrics).not.toBeNull();
        expect(metrics?.attackPotential).toBe(0);

        // Check the tuple implicitly by checking AP. 
        // Ideally I would check the tuple directly but calculateAttackTreeMetrics returns { ap, criticalPaths }.
        // calculateNodeMetrics returns the tuple.
    });
});
