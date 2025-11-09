import JSZip from 'jszip';
import { AttackPotentialTuple, NeedType, Project, RiskTreatmentDecision } from '../types';
import { calculateAP, calculateHighestImpact, calculateRiskLevel, getAttackFeasibilityRating } from './riskService';

// Import template files
import confPyTemplate from './templates/conf.py.template?raw';
import indexRstTemplate from './templates/index.rst.template?raw';
import pyprojectTomlTemplate from './templates/pyproject.toml.template?raw';

const rstHeader = (title: string, level: number): string => {
    const underlines = ['=', '-', '`', ':', '.', "'", '"', '~', '^', '_', '*', '+', '#', '<', '>'];
    if (level < 0 || level >= underlines.length) {
        level = 0;
    }
    return `${title}\n${underlines[level].repeat(title.length)}\n\n`;
};

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

const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const generateNeedRst = (needData: { [key: string]: any }, type: string, title: string, id: string, description: string): string => {
    let content = `.. ${type}:: ${title}\n`;
    content += `   :id: ${id}\n`;

    const excludeFields = new Set(['id', 'type', 'title', 'description', 'position', 'name', 'comment']);

    for (const key of Object.keys(needData)) {
        if (excludeFields.has(key)) continue;

        const value = needData[key];
        if (value === undefined || value === null) continue;

        const snakeKey = toSnakeCase(key);

        if (Array.isArray(value)) {
            if (value.length > 0) {
                content += `   :${snakeKey}: ${value.join(', ')}\n`;
            }
        } else if (typeof value === 'object') {
            if (key === 'attackPotential' && value) {
                const ap = value as AttackPotentialTuple;
                const apValues = Object.entries(ap).map(([k, v]) => `${k}:${v}`).join('; ');
                content += `   :attack_potential: ${apValues}\n`;
            }
        }
        else if (value !== '' && typeof value !== 'boolean') {
            content += `   :${snakeKey}: ${value}\n`;
        }
        else if (typeof value === 'boolean') {
            content += `   :${snakeKey}: ${value ? 'True' : 'False'}\n`;
        }
    }

    const cleanedDescription = description && description.trim().length > 0 ? description : 'No description provided.';
    content += `\n   ${cleanedDescription.replace(/\n/g, '\n   ')}\n\n`;
    return content;
};


const generatePyProjectToml = (): string => {
    return pyprojectTomlTemplate.trim();
};

const generateConfPy = (projectName: string): string => {
    return confPyTemplate.replace('{{PROJECT_NAME}}', projectName.replace(/'/g, "\\'"));
};

const generateIndexRst = (projectName: string): string => {
    const title = rstHeader(projectName, 0);
    return indexRstTemplate.replace('{{PROJECT_TITLE}}', title);
};

const generateProjectMetaRst = (project: Project): string => {
    let content = rstHeader('Project Metadata', 0);
    content += `* **Security Manager**: ${project.securityManager || 'N/A'}\n`;
    content += `* **Project Status**: ${project.projectStatus || 'N/A'}\n\n`;
    if (project.comment) {
        content += rstHeader('Comment', 1);
        content += `${project.comment}\n\n`;
    }
    return content;
};

const generateScopeAndAssumptionsRst = (project: Project): string => {
    let content = rstHeader('Scope and Assumptions', 0);
    if (project.toeDescription) {
        content += rstHeader('TOE Description', 1);
        content += `${project.toeDescription}\n\n`;
    }
    if (project.scope) {
        content += rstHeader('Scope', 1);
        content += `${project.scope}\n\n`;
    }
    if (project.assumptions && project.assumptions.length > 0) {
        content += rstHeader('Assumptions', 1);
        project.assumptions.forEach(a => {
            content += generateNeedRst(a, 'ass', a.name, a.id, a.comment);
        });
    }
    return content;
};

const generateSystemDefRst = (project: Project): string => {
    let content = rstHeader('System Definition', 0);
    if (project.toeConfigurations && project.toeConfigurations.length > 0) {
        content += rstHeader('TOE Configurations', 1);
        const headers = ['ID', 'Name', 'Active', 'Description'];
        const rows = project.toeConfigurations.map(c => [c.id, c.name, c.active ? 'Yes' : 'No', c.description]);
        content += rstListTable(headers, rows);
    }
    if (project.assets && project.assets.length > 0) {
        content += rstHeader('Assets', 1);
        project.assets.forEach(a => {
            const desc = `${a.description}\n\n**Comment:** ${a.comment}`;
            content += generateNeedRst(a, 'asset', a.name, a.id, desc);
        });
    }
    if (project.securityControls && project.securityControls.length > 0) {
        content += rstHeader('Security Controls', 1);
        project.securityControls.forEach(sc => {
            const desc = `${sc.description}\n\n**Comment:** ${sc.comment}`;
            content += generateNeedRst(sc, 'sc', sc.name, sc.id, desc);
        });
    }
    return content;
};

const generateThreatAnalysisRst = (project: Project): string => {
    let content = rstHeader('Threat Analysis', 0);
    if (project.damageScenarios && project.damageScenarios.length > 0) {
        content += rstHeader('Damage Scenarios', 1);
        project.damageScenarios.forEach(ds => {
            const desc = `${ds.description}\n\n**Reasoning:**\n${ds.reasoning}\n\n**Comment:**\n${ds.comment}`;
            content += generateNeedRst(ds, 'ds', ds.name, ds.id, desc);
        });
    }
    if (project.threats && project.threats.length > 0) {
        content += rstHeader('Threats Overview', 1);
        content += 'The following threats have been identified. Click on a threat to see detailed analysis including attack trees.\n\n';

        // Create table of contents for threat detail pages
        content += '.. toctree::\n';
        content += '   :maxdepth: 2\n';
        content += '   :caption: Detailed Threat Analysis:\n\n';

        project.threats.forEach(t => {
            content += `   threats/${t.id}\n`;
        });
        content += '\n';

        // Summary table of threats
        const headers = ['Threat ID', 'Name', 'Asset', 'Security Property', 'Initial AFR', 'Residual AFR'];
        const rows = project.threats.map(t => {
            const asset = (project.assets || []).find(a => a.id === t.assetId);
            return [
                `:need:\`${t.id}\``,
                t.name,
                asset?.name || t.assetId,
                t.securityProperty,
                t.initialAFR,
                t.residualAFR
            ];
        });
        content += rstListTable(headers, rows, 'Threats Summary', [15, 25, 20, 15, 12, 13]);
    }
    if (project.threatScenarios && project.threatScenarios.length > 0) {
        content += rstHeader('Threat Scenarios', 1);
        project.threatScenarios.forEach(ts => {
            const desc = `${ts.description}\n\n**Comment:**\n${ts.comment}`;
            content += generateNeedRst(ts, 'ts', ts.name, ts.id, desc);
        });
    }
    return content;
};

const generateAttackTreesRst = (project: Project): string => {
    let content = rstHeader('Attack Trees', 0);
    const attackTreeRoots = project.needs.filter(n => n.type === NeedType.ATTACK && (n.tags.includes('attack-root') || n.tags.includes('circumvent-root')));

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

const generateRiskTreatmentRst = (project: Project): string => {
    let content = rstHeader('Risk Treatment', 0);
    if (project.securityGoals && project.securityGoals.length > 0) {
        content += rstHeader('Security Goals', 1);
        project.securityGoals.forEach(sg => {
            content += generateNeedRst(sg, 'sg', sg.name, sg.id, sg.comment);
        });
    }
    if (project.securityClaims && project.securityClaims.length > 0) {
        content += rstHeader('Security Claims', 1);
        project.securityClaims.forEach(sc => {
            content += generateNeedRst(sc, 'scl', sc.name, sc.id, sc.comment);
        });
    }

    const scenariosWithRisk = (project.threatScenarios || []).map(ts => {
        const impact = calculateHighestImpact(ts.damageScenarioIds, project.damageScenarios || []);
        const ap = calculateAP(ts.attackPotential);
        const rating = getAttackFeasibilityRating(ap);
        const risk = calculateRiskLevel(rating, impact);
        return { ...ts, risk };
    });

    if (scenariosWithRisk.length > 0) {
        content += rstHeader('Risk Treatment Decisions', 1);
        const headers = ['Threat Scenario', 'Risk Level', 'Decision', 'Mitigation/Justification'];
        const rows = scenariosWithRisk.map(ts => {
            let mitigation = '';
            if (ts.treatmentDecision === RiskTreatmentDecision.REDUCE) {
                mitigation = (ts.securityGoalIds || []).map(id => `:need:\`${id}\``).join(', ');
            } else if (ts.treatmentDecision === RiskTreatmentDecision.ACCEPT || ts.treatmentDecision === RiskTreatmentDecision.TRANSFER) {
                mitigation = (ts.securityClaimIds || []).map(id => `:need:\`${id}\``).join(', ');
            }
            return [`:need:\`${ts.id}\``, ts.risk, ts.treatmentDecision || 'TBD', mitigation];
        });
        content += rstListTable(headers, rows, undefined, [30, 15, 15, 40]);
    }

    return content;
}

const generateThreatDetailRst = (threat: any, project: Project): string => {
    const asset = (project.assets || []).find(a => a.id === threat.assetId);
    const damageScenarios = (project.damageScenarios || []).filter(ds => threat.damageScenarioIds.includes(ds.id));
    const threatScenarios = (project.threatScenarios || []).filter(ts => ts.threatId === threat.id);
    const misuseCases = (project.misuseCases || []).filter(mc => threat.misuseCaseIds?.includes(mc.id));

    let content = rstHeader(`Threat: ${threat.name}`, 0);

    // Threat details
    content += rstHeader('Threat Details', 1);
    content += generateNeedRst(threat, 'threat', threat.name, threat.id, `${threat.comment}\n\n**Reasoning for scaling:**\n${threat.reasoningScaling}`);

    // Asset information
    if (asset) {
        content += rstHeader('Affected Asset', 1);
        content += `This threat targets the **${threat.securityProperty}** of the following asset:\n\n`;
        content += `* **Asset:** :need:\`${asset.id}\` - ${asset.name}\n`;
        content += `* **Description:** ${asset.description}\n\n`;
    }

    // Damage scenarios
    if (damageScenarios.length > 0) {
        content += rstHeader('Related Damage Scenarios', 1);
        const headers = ['ID', 'Name', 'Impact', 'Category'];
        const rows = damageScenarios.map(ds => [
            `:need:\`${ds.id}\``,
            ds.name,
            ds.impact,
            ds.impactCategory
        ]);
        content += rstListTable(headers, rows, undefined, [15, 35, 15, 35]);
    }

    // Attack tree from needs
    const attackTreeRoot = project.needs.find(n => n.id === threat.id && n.type === NeedType.ATTACK);
    if (attackTreeRoot) {
        content += rstHeader('Attack Tree', 1);
        content += `The following attack tree visualizes the potential attack paths for this threat.\n\n`;

        // Collect all nodes in the attack tree
        const needsMap = new Map(project.needs.map(n => [n.id, n]));
        const treeNodeIds = new Set<string>();
        const queue: string[] = [threat.id];
        treeNodeIds.add(threat.id);

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

        // Add needflow directive for visualization
        content += `.. needflow:: Attack Tree Flow for ${threat.id}\n`;
        content += `   :root_id: ${threat.id}\n`;
        content += `   :show_link_names:\n`;
        content += `   :align: center\n\n`;

        // Add image directive
        content += `.. image:: ../_image/attack_tree_${threat.id}.png\n`;
        content += `   :alt: Attack Tree for ${threat.id}\n`;
        content += `   :align: center\n`;
        content += `   :width: 100%\n\n`;

        // Add table of attack tree nodes
        if (treeNodeIds.size > 0) {
            content += rstHeader('Attack Tree Nodes', 2);
            const nodeIdsList = Array.from(treeNodeIds).map(id => `'${id}'`).join(', ');
            content += `.. needtable:: Attack nodes for ${threat.id}\n`;
            content += `   :filter: id in [${nodeIdsList}]\n`;
            content += `   :columns: id, title, type, logic_gate, status\n`;
            content += `   :style: table\n\n`;
        }
    }

    // Misuse cases
    if (misuseCases.length > 0) {
        content += rstHeader('Related Misuse Cases', 1);
        misuseCases.forEach(mc => {
            content += generateNeedRst(mc, 'mc', mc.name, mc.id, `${mc.description}\n\n**Comment:**\n${mc.comment}`);
        });
    }

    // Threat scenarios
    if (threatScenarios.length > 0) {
        content += rstHeader('Threat Scenarios', 1);
        content += `The following scenarios describe specific attack instances for this threat:\n\n`;

        const scenariosWithRisk = threatScenarios.map(ts => {
            const impact = calculateHighestImpact(ts.damageScenarioIds, project.damageScenarios || []);
            const ap = calculateAP(ts.attackPotential);
            const rating = getAttackFeasibilityRating(ap);
            const risk = calculateRiskLevel(rating, impact);
            return { ...ts, rating, risk };
        });

        // Scenario summary table
        const headers = ['Scenario ID', 'Name', 'AFR', 'Risk Level', 'Treatment'];
        const rows = scenariosWithRisk.map(ts => [
            `:need:\`${ts.id}\``,
            ts.name,
            ts.rating,
            ts.risk,
            ts.treatmentDecision || 'TBD'
        ]);
        content += rstListTable(headers, rows, undefined, [15, 30, 15, 15, 15]);

        // Detailed scenario information
        content += rstHeader('Scenario Details', 2);
        scenariosWithRisk.forEach(ts => {
            content += generateNeedRst(ts, 'ts', ts.name, ts.id, `${ts.description}\n\n**Comment:**\n${ts.comment}`);

            // Risk treatment information
            if (ts.treatmentDecision === RiskTreatmentDecision.REDUCE && ts.securityGoalIds && ts.securityGoalIds.length > 0) {
                content += `**Risk Reduction via Security Goals:** ${ts.securityGoalIds.map(id => `:need:\`${id}\``).join(', ')}\n\n`;
            } else if ((ts.treatmentDecision === RiskTreatmentDecision.ACCEPT || ts.treatmentDecision === RiskTreatmentDecision.TRANSFER) && ts.securityClaimIds && ts.securityClaimIds.length > 0) {
                content += `**Risk ${ts.treatmentDecision} based on Security Claims:** ${ts.securityClaimIds.map(id => `:need:\`${id}\``).join(', ')}\n\n`;
            }
        });
    }

    return content;
};

export async function exportProjectToSphinxZip(project: Project, images: Map<string, string>): Promise<Blob> {
    const zip = new JSZip();

    zip.file('pyproject.toml', generatePyProjectToml());
    zip.file('source/conf.py', generateConfPy(project.name));

    const source = zip.folder('source');
    if (!source) throw new Error("Could not create source folder in zip.");

    source.file('index.rst', generateIndexRst(project.name));
    source.file('01_project_meta.rst', generateProjectMetaRst(project));
    source.file('02_scope_and_assumptions.rst', generateScopeAndAssumptionsRst(project));
    source.file('03_system_definition.rst', generateSystemDefRst(project));
    source.file('04_threat_analysis.rst', generateThreatAnalysisRst(project));
    source.file('05_attack_trees.rst', generateAttackTreesRst(project));
    source.file('06_risk_treatment.rst', generateRiskTreatmentRst(project));

    // Generate individual threat detail pages
    const threatsFolder = source.folder('threats');
    if (!threatsFolder) throw new Error("Could not create threats folder in zip.");

    if (project.threats && project.threats.length > 0) {
        project.threats.forEach(threat => {
            threatsFolder.file(`${threat.id}.rst`, generateThreatDetailRst(threat, project));
        });
    }

    const imageFolder = source.folder('_image');
    if (!imageFolder) throw new Error("Could not create _image folder in zip.");

    for (const [rootId, dataUrl] of images.entries()) {
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        imageFolder.file(`attack_tree_${rootId}.png`, base64Data, { base64: true });
    }

    source.folder('_static');
    source.folder('_templates');

    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
}