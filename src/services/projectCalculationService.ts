
import { Project, Threat, AttackFeasibilityRating } from '../types';
import { calculateAttackTreeMetrics } from './attackTreeService';
import { getAttackFeasibilityRating } from './riskService';

export function recalculateProject(project: Project): Project {
    const projectCopy = JSON.parse(JSON.stringify(project));

    if (!projectCopy.threats) {
        return projectCopy;
    }

    const updatedThreats = projectCopy.threats.map((threat: Threat) => {
        const metrics = calculateAttackTreeMetrics(threat.id, projectCopy.needs || [], projectCopy.toeConfigurations || []);

        let initialAFR: AttackFeasibilityRating | 'TBD' = 'TBD';
        if (metrics) {
            initialAFR = getAttackFeasibilityRating(metrics.attackPotential);
        }

        // TODO: Implement residual AFR calculation when circumvent trees are supported.
        // For now, it mirrors the initial AFR as a placeholder.
        const residualAFR = initialAFR;

        return {
            ...threat,
            initialAFR,
            residualAFR,
        };
    });

    return {
        ...projectCopy,
        threats: updatedThreats,
    };
}
