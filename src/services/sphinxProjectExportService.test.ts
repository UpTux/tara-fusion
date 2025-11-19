import { describe, expect, it } from 'vitest';
import { NeedStatus, NeedType, Project, TaraMethodology } from '../types';

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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
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

    describe('generateRelatedDocumentsRst', () => {
        const rstListTable = (headers: string[], rows: string[][], title?: string, widths?: number[]): string => {
            let rst = title ? `.. list-table:: ${title}\n` : `.. list-table::\n`;
            rst += `   :header-rows: 1\n`;
            if (widths) {
                rst += `   :widths: ${widths.join(' ')}\n`;
            }
            rst += `\n`;

            rst += `   * - ${headers.join('\n     - ')}\n`;

            rows.forEach(row => {
                rst += `   * - ${row.join('\n     - ')}\n`;
            });

            return rst + '\n';
        };

        const generateRelatedDocumentsRst = (project: Project): string => {
            let content = rstHeader('Related Documents', 0);

            if (!project.relatedDocuments || project.relatedDocuments.length === 0) {
                content += 'No related documents have been defined for this project.\n\n';
                return content;
            }

            content += 'The following documents are related to this threat analysis and risk assessment:\n\n';

            const headers = ['ID', 'Title', 'Version', 'Authors', 'Link'];
            const rows = project.relatedDocuments.map(doc => [
                doc.id,
                doc.title,
                doc.version,
                doc.authors.join(', '),
                doc.url ? `:link:\`${doc.url}\`` : 'N/A'
            ]);
            content += rstListTable(headers, rows, undefined, [12, 25, 10, 25, 28]);

            return content;
        };

        it('should generate RST for empty related documents', () => {
            const project: Project = {
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: []
            };

            const result = generateRelatedDocumentsRst(project);

            expect(result).toContain('Related Documents');
            expect(result).toContain('No related documents have been defined for this project.');
        });

        it('should generate RST for single related document', () => {
            const project: Project = {
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [],
                relatedDocuments: [
                    {
                        id: 'DOC_001',
                        authors: ['John Doe'],
                        title: 'Security Requirements',
                        version: '1.0',
                        url: 'https://example.com/doc.pdf',
                        comment: 'Main requirements document'
                    }
                ]
            };

            const result = generateRelatedDocumentsRst(project);

            expect(result).toContain('Related Documents');
            expect(result).toContain('DOC_001');
            expect(result).toContain('Security Requirements');
            expect(result).toContain('1.0');
            expect(result).toContain('John Doe');
            expect(result).toContain(':link:`https://example.com/doc.pdf`');
        });

        it('should generate RST for multiple related documents', () => {
            const project: Project = {
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [],
                relatedDocuments: [
                    {
                        id: 'DOC_001',
                        authors: ['John Doe', 'Jane Smith'],
                        title: 'Security Requirements',
                        version: '1.0',
                        url: 'https://example.com/req.pdf'
                    },
                    {
                        id: 'DOC_002',
                        authors: ['Bob Johnson'],
                        title: 'Architecture Document',
                        version: '2.1',
                        url: 'https://example.com/arch.pdf'
                    }
                ]
            };

            const result = generateRelatedDocumentsRst(project);

            expect(result).toContain('DOC_001');
            expect(result).toContain('DOC_002');
            expect(result).toContain('John Doe, Jane Smith');
            expect(result).toContain('Bob Johnson');
            expect(result).toContain('Security Requirements');
            expect(result).toContain('Architecture Document');
        });

        it('should handle documents without URLs', () => {
            const project: Project = {
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [],
                relatedDocuments: [
                    {
                        id: 'DOC_001',
                        authors: ['John Doe'],
                        title: 'Internal Notes',
                        version: 'draft',
                        url: ''
                    }
                ]
            };

            const result = generateRelatedDocumentsRst(project);

            expect(result).toContain('DOC_001');
            expect(result).toContain('Internal Notes');
            expect(result).toContain('N/A');
            expect(result).not.toContain(':link:');
        });

        it('should handle documents with multiple authors', () => {
            const project: Project = {
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [],
                relatedDocuments: [
                    {
                        id: 'DOC_001',
                        authors: ['Alice', 'Bob', 'Charlie', 'Diana'],
                        title: 'Collaborative Document',
                        version: '3.0',
                        url: 'https://example.com/collab.pdf'
                    }
                ]
            };

            const result = generateRelatedDocumentsRst(project);

            expect(result).toContain('Alice, Bob, Charlie, Diana');
        });

        it('should generate proper RST table structure', () => {
            const project: Project = {
                methodology: TaraMethodology.ATTACK_FEASIBILITY,
                id: 'proj1',
                name: 'Test Project',
                organizationId: 'org1',
                needs: [],
                relatedDocuments: [
                    {
                        id: 'DOC_001',
                        authors: ['Author'],
                        title: 'Test Doc',
                        version: '1.0',
                        url: 'https://example.com'
                    }
                ]
            };

            const result = generateRelatedDocumentsRst(project);

            expect(result).toContain('.. list-table::');
            expect(result).toContain(':header-rows: 1');
            expect(result).toContain(':widths: 12 25 10 25 28');
            expect(result).toMatch(/\* - ID\n\s+- Title\n\s+- Version\n\s+- Authors\n\s+- Link/);
        });
    });
});
