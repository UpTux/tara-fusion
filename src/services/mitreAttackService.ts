/**
 * Service for loading and managing MITRE ATT&CK data
 * Converts MITRE ATT&CK techniques into technical attack trees
 */

import type { Tactic, Technique } from '@mitre-attack/attack-data-model';
import type { SphinxNeed } from '../types';
import { NeedStatus, NeedType } from '../types';

// STIX Bundle type definition
interface StixBundle {
    type: string;
    id: string;
    objects: any[];
}

export interface MitreTechnique {
    id: string; // e.g., "T1055"
    name: string;
    description: string;
    tactics: string[]; // Tactic names
    platforms: string[];
    dataSourcesRequired: string[];
    subtechniques: MitreTechnique[];
    killChainPhases: string[];
    url: string;
    detectionDescription?: string;
    mitigations?: string[];
    matrix: 'enterprise' | 'mobile' | 'ics'; // Which ATT&CK matrix this belongs to
}

export interface MitreTactic {
    id: string;
    name: string;
    shortName: string;
    description: string;
    techniques: string[]; // Technique IDs
    url: string;
    matrix: 'enterprise' | 'mobile' | 'ics'; // Which ATT&CK matrix this belongs to
}

export interface MitreAttackDatabase {
    techniques: Map<string, MitreTechnique>;
    tactics: Map<string, MitreTactic>;
    version: string;
    lastUpdated: string;
    matrices: {
        enterprise: { techniques: number; tactics: number };
        mobile: { techniques: number; tactics: number };
        ics: { techniques: number; tactics: number };
    };
}

let cachedDatabase: MitreAttackDatabase | null = null;

/**
 * Load MITRE ATT&CK data from all matrices (Enterprise, Mobile, ICS)
 */
export async function loadMitreAttackData(): Promise<MitreAttackDatabase> {
    if (cachedDatabase) {
        return cachedDatabase;
    }

    try {
        // Load all three matrices
        const matrices = [
            { name: 'enterprise' as const, url: '/attack-stix-data/enterprise-attack/enterprise-attack-18.0.json' },
            { name: 'mobile' as const, url: '/attack-stix-data/mobile-attack/mobile-attack-18.0.json' },
            { name: 'ics' as const, url: '/attack-stix-data/ics-attack/ics-attack-18.0.json' },
        ];

        const techniques = new Map<string, MitreTechnique>();
        const tactics = new Map<string, MitreTactic>();
        const matrixStats = {
            enterprise: { techniques: 0, tactics: 0 },
            mobile: { techniques: 0, tactics: 0 },
            ics: { techniques: 0, tactics: 0 },
        };

        // Load each matrix
        for (const matrix of matrices) {
            const response = await fetch(matrix.url);
            if (!response.ok) {
                console.warn(`Failed to fetch ${matrix.name} ATT&CK data: ${response.statusText}`);
                continue;
            }

            const stixData = await response.json();
            const bundle = stixData as StixBundle;

            if (!bundle.objects || !Array.isArray(bundle.objects)) {
                console.warn(`Invalid STIX bundle format for ${matrix.name}`);
                continue;
            }

            // Extract techniques from the bundle
            const allTechniques: Technique[] = [];
            for (const obj of bundle.objects) {
                if (obj.type === 'attack-pattern') {
                    allTechniques.push(obj as Technique);
                }
            }

            // Process main techniques
            for (const technique of allTechniques) {
                const externalId = getExternalId(technique);
                if (!externalId || technique.x_mitre_is_subtechnique) continue;

                const mitreTechnique: MitreTechnique = {
                    id: externalId,
                    name: technique.name,
                    description: technique.description || '',
                    tactics: extractTactics(technique),
                    platforms: technique.x_mitre_platforms || [],
                    dataSourcesRequired: technique.x_mitre_data_sources || [],
                    subtechniques: [],
                    killChainPhases: extractKillChainPhases(technique),
                    url: getAttackUrl(technique),
                    detectionDescription: technique.x_mitre_detection,
                    matrix: matrix.name,
                };

                techniques.set(externalId, mitreTechnique);
                matrixStats[matrix.name].techniques++;
            }

            // Add subtechniques to parent techniques
            for (const technique of allTechniques) {
                const externalId = getExternalId(technique);
                if (!externalId || !technique.x_mitre_is_subtechnique) continue;

                const parentId = externalId.split('.')[0];
                const parent = techniques.get(parentId);

                if (parent) {
                    const subTechnique: MitreTechnique = {
                        id: externalId,
                        name: technique.name,
                        description: technique.description || '',
                        tactics: extractTactics(technique),
                        platforms: technique.x_mitre_platforms || [],
                        dataSourcesRequired: technique.x_mitre_data_sources || [],
                        subtechniques: [],
                        killChainPhases: extractKillChainPhases(technique),
                        url: getAttackUrl(technique),
                        detectionDescription: technique.x_mitre_detection,
                        matrix: matrix.name,
                    };
                    parent.subtechniques.push(subTechnique);
                }
            }

            // Extract tactics from the bundle
            const allTactics: Tactic[] = [];
            for (const obj of bundle.objects) {
                if (obj.type === 'x-mitre-tactic') {
                    allTactics.push(obj as Tactic);
                }
            }

            for (const tactic of allTactics) {
                const externalId = getExternalId(tactic);
                if (!externalId) continue;

                // Create unique ID for tactics across matrices (e.g., TA0001-enterprise)
                const tacticKey = `${externalId}-${matrix.name}`;

                const mitreTactic: MitreTactic = {
                    id: externalId,
                    name: tactic.name,
                    shortName: tactic.x_mitre_shortname || tactic.name,
                    description: tactic.description || '',
                    techniques: [],
                    url: getAttackUrl(tactic),
                    matrix: matrix.name,
                };

                tactics.set(tacticKey, mitreTactic);
                matrixStats[matrix.name].tactics++;
            }

            // Map techniques to tactics for this matrix
            for (const [id, technique] of techniques) {
                if (technique.matrix !== matrix.name) continue;

                const tacticNames = technique.tactics;
                for (const tacticName of tacticNames) {
                    for (const [tacticKey, tactic] of tactics) {
                        if (tactic.matrix !== matrix.name) continue;

                        if (tactic.name.toLowerCase() === tacticName.toLowerCase() ||
                            tactic.shortName.toLowerCase() === tacticName.toLowerCase()) {
                            if (!tactic.techniques.includes(id)) {
                                tactic.techniques.push(id);
                            }
                        }
                    }
                }
            }
        }

        cachedDatabase = {
            techniques,
            tactics,
            version: '18.0',
            lastUpdated: '2025-10-28',
            matrices: matrixStats,
        };

        return cachedDatabase;
    } catch (error) {
        console.error('Failed to load MITRE ATT&CK data:', error);
        throw new Error('Could not load MITRE ATT&CK database');
    }
}

/**
 * Convert a MITRE technique to a technical attack tree (SphinxNeed format)
 */
export function convertTechniqueToTechnicalTree(
    technique: MitreTechnique,
    existingIds: Set<string>,
    includeSubtechniques: boolean = true
): SphinxNeed[] {
    const needs: SphinxNeed[] = [];

    // Generate unique ID
    let rootId = `TAT_MITRE_${technique.id.replace('.', '_')}`;
    let counter = 1;
    while (existingIds.has(rootId)) {
        rootId = `TAT_MITRE_${technique.id.replace('.', '_')}_${counter}`;
        counter++;
    }
    existingIds.add(rootId);

    // Create root node for the technique
    const rootNode: SphinxNeed = {
        id: rootId,
        type: NeedType.ATTACK,
        title: `${technique.id}: ${technique.name}`,
        description: formatTechniqueDescription(technique),
        status: NeedStatus.OPEN,
        tags: ['technical-root', 'mitre-attack', ...technique.tactics.map(t => `tactic:${t.toLowerCase()}`)],
        links: [],
        logic_gate: technique.subtechniques.length > 0 ? 'OR' : undefined,
        position: { x: 50, y: 50 },
    };

    needs.push(rootNode);

    // Add subtechniques as child nodes if requested
    if (includeSubtechniques && technique.subtechniques.length > 0) {
        const childLinks: string[] = [];

        for (const subTechnique of technique.subtechniques) {
            let childId = `TAT_MITRE_${subTechnique.id.replace('.', '_')}`;
            let subCounter = 1;
            while (existingIds.has(childId)) {
                childId = `TAT_MITRE_${subTechnique.id.replace('.', '_')}_${subCounter}`;
                subCounter++;
            }
            existingIds.add(childId);

            const childNode: SphinxNeed = {
                id: childId,
                type: NeedType.ATTACK,
                title: `${subTechnique.id}: ${subTechnique.name}`,
                description: formatTechniqueDescription(subTechnique),
                status: NeedStatus.OPEN,
                tags: ['mitre-attack', 'subtechnique', ...subTechnique.tactics.map(t => `tactic:${t.toLowerCase()}`)],
                links: [],
                position: { x: 50, y: 150 + (needs.length - 1) * 100 },
            };

            needs.push(childNode);
            childLinks.push(childId);
        }

        // Link children to root
        rootNode.links = childLinks;
    }

    return needs;
}

/**
 * Format technique description with all relevant information
 */
function formatTechniqueDescription(technique: MitreTechnique): string {
    let desc = `**MITRE ATT&CK Technique: ${technique.id}**\n\n`;
    desc += `${technique.description}\n\n`;

    if (technique.tactics.length > 0) {
        desc += `**Tactics:** ${technique.tactics.join(', ')}\n\n`;
    }

    if (technique.platforms.length > 0) {
        desc += `**Platforms:** ${technique.platforms.join(', ')}\n\n`;
    }

    if (technique.dataSourcesRequired.length > 0) {
        desc += `**Data Sources:** ${technique.dataSourcesRequired.join(', ')}\n\n`;
    }

    if (technique.detectionDescription) {
        desc += `**Detection:**\n${technique.detectionDescription}\n\n`;
    }

    desc += `**Reference:** ${technique.url}`;

    return desc;
}

/**
 * Extract external ID (e.g., T1055) from technique/tactic
 */
function getExternalId(obj: Technique | Tactic): string | null {
    if (!obj.external_references) return null;

    const mitreRef = obj.external_references.find(ref => ref.source_name === 'mitre-attack');
    return mitreRef?.external_id || null;
}

/**
 * Extract tactic names from technique
 */
function extractTactics(technique: Technique): string[] {
    if (!technique.kill_chain_phases) return [];

    return technique.kill_chain_phases
        .filter(phase => phase.kill_chain_name === 'mitre-attack')
        .map(phase => phase.phase_name)
        .map(name => name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '));
}

/**
 * Extract kill chain phases from technique
 */
function extractKillChainPhases(technique: Technique): string[] {
    if (!technique.kill_chain_phases) return [];

    return technique.kill_chain_phases
        .filter(phase => phase.kill_chain_name === 'mitre-attack')
        .map(phase => phase.phase_name);
}

/**
 * Get ATT&CK website URL for technique/tactic
 */
function getAttackUrl(obj: Technique | Tactic): string {
    if (!obj.external_references) return 'https://attack.mitre.org';

    const mitreRef = obj.external_references.find(ref => ref.source_name === 'mitre-attack');
    return mitreRef?.url || 'https://attack.mitre.org';
}

/**
 * Search techniques by keyword
 */
export function searchTechniques(
    database: MitreAttackDatabase,
    query: string
): MitreTechnique[] {
    const lowerQuery = query.toLowerCase();
    const results: MitreTechnique[] = [];

    for (const technique of database.techniques.values()) {
        // Search in ID, name, and description
        if (
            technique.id.toLowerCase().includes(lowerQuery) ||
            technique.name.toLowerCase().includes(lowerQuery) ||
            technique.description.toLowerCase().includes(lowerQuery)
        ) {
            results.push(technique);
        }
    }

    return results;
}

/**
 * Filter techniques by tactic
 */
export function getTechniquesByTactic(
    database: MitreAttackDatabase,
    tacticName: string
): MitreTechnique[] {
    const results: MitreTechnique[] = [];
    const lowerTactic = tacticName.toLowerCase();

    for (const technique of database.techniques.values()) {
        if (technique.tactics.some(t => t.toLowerCase() === lowerTactic)) {
            results.push(technique);
        }
    }

    return results;
}

/**
 * Filter techniques by platform
 */
export function getTechniquesByPlatform(
    database: MitreAttackDatabase,
    platform: string
): MitreTechnique[] {
    const results: MitreTechnique[] = [];
    const lowerPlatform = platform.toLowerCase();

    for (const technique of database.techniques.values()) {
        if (technique.platforms.some(p => p.toLowerCase().includes(lowerPlatform))) {
            results.push(technique);
        }
    }

    return results;
}

/**
 * Get all unique platforms
 */
export function getAllPlatforms(database: MitreAttackDatabase): string[] {
    const platforms = new Set<string>();

    for (const technique of database.techniques.values()) {
        technique.platforms.forEach(p => platforms.add(p));
    }

    return Array.from(platforms).sort();
}
