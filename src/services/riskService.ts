import { Impact, AttackFeasibilityRating, RiskLevel, DamageScenario, AttackPotentialTuple } from '../types';

const impactScoreMap: Record<Impact, number> = {
    [Impact.NEGLIGIBLE]: 1,
    [Impact.MODERATE]: 2,
    [Impact.MAJOR]: 3,
    [Impact.SEVERE]: 4,
};

const feasibilityScoreMap: Record<AttackFeasibilityRating, number> = {
    [AttackFeasibilityRating.VERY_LOW]: 1,
    [AttackFeasibilityRating.LOW]: 2,
    [AttackFeasibilityRating.MEDIUM]: 3,
    [AttackFeasibilityRating.HIGH]: 4,
};

export const calculateAP = (potential: AttackPotentialTuple): number => {
    if (!potential) return 999;
    // If any value is 'infeasible' (99), the whole path is infeasible.
    if (Object.values(potential).some(v => v === 99)) return 99;
    return potential.time + potential.expertise + potential.knowledge + potential.access + potential.equipment;
};

export const getAttackFeasibilityRating = (ap: number): AttackFeasibilityRating => {
    if (ap <= 13) return AttackFeasibilityRating.HIGH;
    if (ap <= 19) return AttackFeasibilityRating.MEDIUM;
    if (ap <= 24) return AttackFeasibilityRating.LOW;
    return AttackFeasibilityRating.VERY_LOW;
};

export const getFeasibilityRatingColor = (rating: AttackFeasibilityRating): string => {
    switch(rating) {
        case AttackFeasibilityRating.HIGH: return 'bg-red-700/50 text-red-200';
        case AttackFeasibilityRating.MEDIUM: return 'bg-orange-700/50 text-orange-200';
        case AttackFeasibilityRating.LOW: return 'bg-yellow-700/50 text-yellow-200';
        case AttackFeasibilityRating.VERY_LOW: return 'bg-green-700/50 text-green-200';
        default: return 'bg-gray-700/50 text-gray-200';
    }
}

// Implements the risk matrix from TARA methodology documentation Figure 6.1
const riskMatrix: Record<AttackFeasibilityRating, Record<Impact, RiskLevel>> = {
  [AttackFeasibilityRating.HIGH]: {
    [Impact.NEGLIGIBLE]: RiskLevel.NEGLIGIBLE, // Risk Level 1
    [Impact.MODERATE]: RiskLevel.MEDIUM,    // Risk Level 3
    [Impact.MAJOR]: RiskLevel.HIGH,         // Risk Level 4
    [Impact.SEVERE]: RiskLevel.CRITICAL,    // Risk Level 5
  },
  [AttackFeasibilityRating.MEDIUM]: {
    [Impact.NEGLIGIBLE]: RiskLevel.NEGLIGIBLE, // Risk Level 1
    [Impact.MODERATE]: RiskLevel.LOW,         // Risk Level 2
    [Impact.MAJOR]: RiskLevel.MEDIUM,      // Risk Level 3
    [Impact.SEVERE]: RiskLevel.HIGH,        // Risk Level 4
  },
  [AttackFeasibilityRating.LOW]: {
    [Impact.NEGLIGIBLE]: RiskLevel.NEGLIGIBLE, // Risk Level 1
    [Impact.MODERATE]: RiskLevel.LOW,         // Risk Level 2
    [Impact.MAJOR]: RiskLevel.LOW,         // Risk Level 2
    [Impact.SEVERE]: RiskLevel.MEDIUM,      // Risk Level 3
  },
  [AttackFeasibilityRating.VERY_LOW]: {
    [Impact.NEGLIGIBLE]: RiskLevel.NEGLIGIBLE, // Risk Level 1
    [Impact.MODERATE]: RiskLevel.NEGLIGIBLE, // Risk Level 1
    [Impact.MAJOR]: RiskLevel.NEGLIGIBLE, // Risk Level 1
    [Impact.SEVERE]: RiskLevel.LOW,         // Risk Level 2
  },
};

export const calculateHighestImpact = (
    selectedDamageScenarioIds: string[],
    allDamageScenarios: DamageScenario[]
): Impact => {
    const selectedScenarios = allDamageScenarios.filter(ds => selectedDamageScenarioIds.includes(ds.id));
    
    if (selectedScenarios.length === 0) {
        return Impact.NEGLIGIBLE;
    }

    const maxScore = Math.max(...selectedScenarios.map(ds => impactScoreMap[ds.impact]));

    return (Object.keys(impactScoreMap) as Impact[]).find(key => impactScoreMap[key] === maxScore) || Impact.NEGLIGIBLE;
};

export const calculateRiskLevel = (
    feasibility: AttackFeasibilityRating,
    impact: Impact
): RiskLevel => {
    return riskMatrix[feasibility]?.[impact] || RiskLevel.NEGLIGIBLE;
};

export const getRiskColor = (riskLevel: RiskLevel): string => {
    switch(riskLevel) {
        case RiskLevel.NEGLIGIBLE: return 'bg-gray-600';
        case RiskLevel.LOW: return 'bg-green-600';
        case RiskLevel.MEDIUM: return 'bg-yellow-500';
        case RiskLevel.HIGH: return 'bg-orange-500';
        case RiskLevel.CRITICAL: return 'bg-red-700';
        default: return 'bg-gray-600';
    }
}

export const riskLevelOrder: Record<RiskLevel, number> = {
    [RiskLevel.CRITICAL]: 5,
    [RiskLevel.HIGH]: 4,
    [RiskLevel.MEDIUM]: 3,
    [RiskLevel.LOW]: 2,
    [RiskLevel.NEGLIGIBLE]: 1,
};