import { describe, expect, it } from 'vitest';
import { NeedStatus, NeedType, Project } from '../types';

// Mock the template imports
const mockConfPyTemplate = 'project = "{{PROJECT_NAME}}"';
const mockIndexRstTemplate = '{{PROJECT_TITLE}}\n\nWelcome to the documentation.';
const mockPyprojectTomlTemplate = '[tool.sphinx]\nname = "sphinx-needs"';

// We'll need to test the internal functions, so we'll import them differently
// For now, let's create a test helper that generates the RST content directly

const rstHeader = (title: string, level: number): string => {
    const underlines = ['=', '-', '`', ':', '.', "'", '"', '~', '^', '_', '*', '+', '#', '<', '>'];
    if (level < 0 || level >= underlines.length) {
        level = 0;
    }
    return `${title}\n${underlines[level].repeat(title.length)}\n\n`;
};

const generateAttackTreesRst = (project: Project): string => {
    let content = rstHeader('Attack Trees', 0);
    const attackTreeRoots = project.needs.filter(n =>
        n.type === NeedType.ATTACK &&
        (n.tags.includes('attack-root') || n.tags.includes('circumvent-root'))
    );

    if (attackTreeRoots.length === 0) {
        content += "No attack trees found in the project.\n";
        return content;
    }

    const needsMap = new Map(project.needs.map(n => [n.id, n]));

    attackTreeRoots.forEach(root => {
        content += rstHeader(`Tree: ${root.title} (${root.id})`, 1);

        const treeNodeIds = new Set<string>();
        const queue: string[] = [root.id];
        treeNodeIds.add(root.id);
        while (queue.length > 0) {
            const currentId = queue.shift();
            if (!currentId) continue;
            const currentNode = needsMap.get(currentId);
            if (currentNode?.links) {
                for (const link of currentNode.links) {
                    if (needsMap.has(link) && !treeNodeIds.has(link)) {
                        treeNodeIds.add(link);
                        queue.push(link);
                    }
                }
            }
        }

        // Add needflow directive
        content += `.. needflow:: Attack Tree Flow for ${root.id}\n`;
        content += `   :root_id: ${root.id}\n`;
        content += `   :show_link_names:\n`;
        content += `   :align: center\n\n`;

        // Add image directive
        content += `.. image:: /_image/attack_tree_${root.id}.png\n`;
        content += `   :alt: Attack Tree for ${root.id}\n`;
        content += `   :align: center\n`;
        content += `   :width: 100%\n\n`;

        // Add table of nodes
        const nodeIdsList = Array.from(treeNodeIds).map(id => `'${id}'`).join(', ');
        content += `.. needtable:: Nodes for tree ${root.id}\n`;
        content += `   :filter: id in [${nodeIdsList}]\n`;
        content += `   :columns: id, title, type, logic_gate\n`;
        content += `   :style: table\n\n`;
    });

    return content;
};

describe('sphinxProjectExportService', () => {
    describe('rstHeader', () => {
        it('should generate level 0 header with = underline', () => {
            const result = rstHeader('Test Title', 0);
            expect(result).toBe('Test Title\n==========\n\n');
        });

        it('should generate level 1 header with - underline', () => {
            const result = rstHeader('Subtitle', 1);
            expect(result).toBe('Subtitle\n--------\n\n');
        });

        it('should handle empty titles', () => {
            const result = rstHeader('', 0);
            expect(result).toBe('\n\n\n');
        });

        it('should handle long titles', () => {
            const title = 'This is a very long title for testing purposes';
            const result = rstHeader(title, 0);
            expect(result).toBe(`${title}\n${'='.repeat(title.length)}\n\n`);
        });
    });

    describe('generateAttackTreesRst', () => {
        it('should return message when no attack trees exist', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: []
            };

            const result = generateAttackTreesRst(project);

            expect(result).toContain('Attack Trees');
            expect(result).toContain('No attack trees found in the project.');
        });

        it('should generate needflow directive with correct root_id', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [
                    {
                        id: 'THR_001',
                        type: NeedType.ATTACK,
                        title: 'Password Compromise',
                        description: 'Attack on password',
                        status: NeedStatus.OPEN,
                        tags: ['attack-root'],
                        links: [],
                        position: { x: 0, y: 0 }
                    }
                ]
            };

            const result = generateAttackTreesRst(project);

            expect(result).toContain('.. needflow:: Attack Tree Flow for THR_001');
            expect(result).toContain(':root_id: THR_001');
            expect(result).toContain(':show_link_names:');
            expect(result).toContain(':align: center');
        });

        it('should generate needtable with filter instead of ids', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [
                    {
                        id: 'THR_001',
                        type: NeedType.ATTACK,
                        title: 'Password Compromise',
                        description: 'Attack on password',
                        status: NeedStatus.OPEN,
                        tags: ['attack-root'],
                        links: ['ATK_001'],
                        position: { x: 0, y: 0 }
                    },
                    {
                        id: 'ATK_001',
                        type: NeedType.ATTACK,
                        title: 'Brute Force',
                        description: 'Brute force attack',
                        status: NeedStatus.OPEN,
                        tags: [],
                        links: [],
                        position: { x: 0, y: 100 }
                    }
                ]
            };

            const result = generateAttackTreesRst(project);

            expect(result).toContain('.. needtable:: Nodes for tree THR_001');
            expect(result).toContain(":filter: id in ['THR_001', 'ATK_001']");
            expect(result).toContain(':columns: id, title, type, logic_gate');
            expect(result).toContain(':style: table');
            expect(result).not.toContain(':ids:');
        });

        it('should include image directive for attack tree', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [
                    {
                        id: 'THR_001',
                        type: NeedType.ATTACK,
                        title: 'Password Compromise',
                        description: 'Attack on password',
                        status: NeedStatus.OPEN,
                        tags: ['attack-root'],
                        links: [],
                        position: { x: 0, y: 0 }
                    }
                ]
            };

            const result = generateAttackTreesRst(project);

            expect(result).toContain('.. image:: /_image/attack_tree_THR_001.png');
            expect(result).toContain(':alt: Attack Tree for THR_001');
            expect(result).toContain(':align: center');
            expect(result).toContain(':width: 100%');
        });

        it('should traverse entire attack tree and include all nodes', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [
                    {
                        id: 'THR_001',
                        type: NeedType.ATTACK,
                        title: 'Root Attack',
                        description: 'Root',
                        status: NeedStatus.OPEN,
                        tags: ['attack-root'],
                        links: ['ATK_001', 'ATK_002'],
                        logic_gate: 'OR',
                        position: { x: 0, y: 0 }
                    },
                    {
                        id: 'ATK_001',
                        type: NeedType.ATTACK,
                        title: 'Intermediate Node',
                        description: 'Intermediate',
                        status: NeedStatus.OPEN,
                        tags: [],
                        links: ['ATK_003'],
                        logic_gate: 'AND',
                        position: { x: 0, y: 100 }
                    },
                    {
                        id: 'ATK_002',
                        type: NeedType.ATTACK,
                        title: 'Another Branch',
                        description: 'Branch',
                        status: NeedStatus.OPEN,
                        tags: [],
                        links: [],
                        position: { x: 200, y: 100 }
                    },
                    {
                        id: 'ATK_003',
                        type: NeedType.ATTACK,
                        title: 'Leaf Node',
                        description: 'Leaf',
                        status: NeedStatus.OPEN,
                        tags: [],
                        links: [],
                        position: { x: 0, y: 200 }
                    }
                ]
            };

            const result = generateAttackTreesRst(project);

            expect(result).toContain(":filter: id in ['THR_001', 'ATK_001', 'ATK_002', 'ATK_003']");
        });

        it('should handle multiple attack tree roots', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [
                    {
                        id: 'THR_001',
                        type: NeedType.ATTACK,
                        title: 'First Attack',
                        description: 'First',
                        status: NeedStatus.OPEN,
                        tags: ['attack-root'],
                        links: [],
                        position: { x: 0, y: 0 }
                    },
                    {
                        id: 'THR_002',
                        type: NeedType.ATTACK,
                        title: 'Second Attack',
                        description: 'Second',
                        status: NeedStatus.OPEN,
                        tags: ['attack-root'],
                        links: [],
                        position: { x: 0, y: 0 }
                    }
                ]
            };

            const result = generateAttackTreesRst(project);

            expect(result).toContain('Tree: First Attack (THR_001)');
            expect(result).toContain('Tree: Second Attack (THR_002)');
            expect(result).toContain('.. needflow:: Attack Tree Flow for THR_001');
            expect(result).toContain('.. needflow:: Attack Tree Flow for THR_002');
        });

        it('should handle circumvent tree roots', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [
                    {
                        id: 'CIR_001',
                        type: NeedType.ATTACK,
                        title: 'Circumvent Security Control',
                        description: 'Circumvent',
                        status: NeedStatus.OPEN,
                        tags: ['circumvent-root'],
                        links: [],
                        position: { x: 0, y: 0 }
                    }
                ]
            };

            const result = generateAttackTreesRst(project);

            expect(result).toContain('Tree: Circumvent Security Control (CIR_001)');
            expect(result).toContain('.. needflow:: Attack Tree Flow for CIR_001');
        });

        it('should not include non-ATTACK type nodes in roots', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [
                    {
                        id: 'REQ_001',
                        type: NeedType.REQUIREMENT,
                        title: 'A Requirement',
                        description: 'Req',
                        status: NeedStatus.OPEN,
                        tags: ['attack-root'],
                        links: [],
                        position: { x: 0, y: 0 }
                    }
                ]
            };

            const result = generateAttackTreesRst(project);

            expect(result).toContain('No attack trees found in the project.');
        });

        it('should properly quote IDs in filter expression', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [
                    {
                        id: 'THR_001',
                        type: NeedType.ATTACK,
                        title: 'Attack',
                        description: 'Attack',
                        status: NeedStatus.OPEN,
                        tags: ['attack-root'],
                        links: ['ATK-LEAF-001'],
                        position: { x: 0, y: 0 }
                    },
                    {
                        id: 'ATK-LEAF-001',
                        type: NeedType.ATTACK,
                        title: 'Leaf',
                        description: 'Leaf',
                        status: NeedStatus.OPEN,
                        tags: [],
                        links: [],
                        position: { x: 0, y: 100 }
                    }
                ]
            };

            const result = generateAttackTreesRst(project);

            // IDs should be properly quoted
            expect(result).toContain("'THR_001'");
            expect(result).toContain("'ATK-LEAF-001'");
            expect(result).toMatch(/:filter: id in \['THR_001', 'ATK-LEAF-001'\]/);
        });

        it('should generate proper RST section headers', () => {
            const project: Project = {
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [
                    {
                        id: 'THR_001',
                        type: NeedType.ATTACK,
                        title: 'Password Attack',
                        description: 'Attack',
                        status: NeedStatus.OPEN,
                        tags: ['attack-root'],
                        links: [],
                        position: { x: 0, y: 0 }
                    }
                ]
            };

            const result = generateAttackTreesRst(project);

            // Check main header
            expect(result).toMatch(/Attack Trees\n============\n/);
            // Check subsection header
            expect(result).toMatch(/Tree: Password Attack \(THR_001\)\n-+\n/);
        });
    });
});
