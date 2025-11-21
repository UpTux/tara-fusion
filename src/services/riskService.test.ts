import { describe, expect, it } from 'vitest';
import {
    AttackFeasibilityRating,
    AttackPotentialTuple,
    DamageScenario,
    Impact,
    RiskLevel,
} from '../types';
import {
    calculateAP,
    calculateHighestImpact,
    calculateRiskLevel,
    getAttackFeasibilityRating,
    getFeasibilityRatingColor,
    getRiskColor,
    riskLevelOrder,
} from './riskService';

describe('riskService', () => {
    describe('calculateAP', () => {
        it('should calculate attack potential sum correctly', () => {
            const potential: AttackPotentialTuple = {
                time: 2,
                expertise: 3,
                knowledge: 4,
                access: 1,
                equipment: 5,
            };
            expect(calculateAP(potential)).toBe(15);
        });

        it('should return 999 for null/undefined potential', () => {
            expect(calculateAP(null as any)).toBe(999);
            expect(calculateAP(undefined as any)).toBe(999);
        });

        it('should return 99 if any value is infeasible (99)', () => {
            const potential: AttackPotentialTuple = {
                time: 2,
                expertise: 99,
                knowledge: 4,
                access: 1,
                equipment: 5,
            };
            expect(calculateAP(potential)).toBe(99);
        });

        it('should return 99 if all values are infeasible', () => {
            const potential: AttackPotentialTuple = {
                time: 99,
                expertise: 99,
                knowledge: 99,
                access: 99,
                equipment: 99,
            };
            expect(calculateAP(potential)).toBe(99);
        });

        it('should calculate AP of 0 for all zero values', () => {
            const potential: AttackPotentialTuple = {
                time: 0,
                expertise: 0,
                knowledge: 0,
                access: 0,
                equipment: 0,
            };
            expect(calculateAP(potential)).toBe(0);
        });

        it('should calculate AP correctly for maximum feasible values', () => {
            const potential: AttackPotentialTuple = {
                time: 10,
                expertise: 10,
                knowledge: 10,
                access: 10,
                equipment: 10,
            };
            expect(calculateAP(potential)).toBe(50);
        });
    });

    describe('getAttackFeasibilityRating', () => {
        it('should return HIGH for AP <= 13', () => {
            expect(getAttackFeasibilityRating(0)).toBe(AttackFeasibilityRating.HIGH);
            expect(getAttackFeasibilityRating(13)).toBe(AttackFeasibilityRating.HIGH);
        });

        it('should return MEDIUM for AP between 14 and 19', () => {
            expect(getAttackFeasibilityRating(14)).toBe(AttackFeasibilityRating.MEDIUM);
            expect(getAttackFeasibilityRating(19)).toBe(AttackFeasibilityRating.MEDIUM);
        });

        it('should return LOW for AP between 20 and 24', () => {
            expect(getAttackFeasibilityRating(20)).toBe(AttackFeasibilityRating.LOW);
            expect(getAttackFeasibilityRating(24)).toBe(AttackFeasibilityRating.LOW);
        });

        it('should return VERY_LOW for AP > 24', () => {
            expect(getAttackFeasibilityRating(25)).toBe(AttackFeasibilityRating.VERY_LOW);
            expect(getAttackFeasibilityRating(100)).toBe(AttackFeasibilityRating.VERY_LOW);
        });

        it('should handle boundary values correctly', () => {
            expect(getAttackFeasibilityRating(13)).toBe(AttackFeasibilityRating.HIGH);
            expect(getAttackFeasibilityRating(14)).toBe(AttackFeasibilityRating.MEDIUM);
            expect(getAttackFeasibilityRating(19)).toBe(AttackFeasibilityRating.MEDIUM);
            expect(getAttackFeasibilityRating(20)).toBe(AttackFeasibilityRating.LOW);
            expect(getAttackFeasibilityRating(24)).toBe(AttackFeasibilityRating.LOW);
            expect(getAttackFeasibilityRating(25)).toBe(AttackFeasibilityRating.VERY_LOW);
        });
    });

    describe('getFeasibilityRatingColor', () => {
        it('should return red color for HIGH rating', () => {
            expect(getFeasibilityRatingColor(AttackFeasibilityRating.HIGH))
                .toBe('bg-red-700/50 text-red-200');
        });

        it('should return orange color for MEDIUM rating', () => {
            expect(getFeasibilityRatingColor(AttackFeasibilityRating.MEDIUM))
                .toBe('bg-orange-700/50 text-orange-200');
        });

        it('should return yellow color for LOW rating', () => {
            expect(getFeasibilityRatingColor(AttackFeasibilityRating.LOW))
                .toBe('bg-yellow-700/50 text-yellow-200');
        });

        it('should return green color for VERY_LOW rating', () => {
            expect(getFeasibilityRatingColor(AttackFeasibilityRating.VERY_LOW))
                .toBe('bg-green-700/50 text-green-200');
        });

        it('should return gray color for unknown rating', () => {
            expect(getFeasibilityRatingColor('UNKNOWN' as any))
                .toBe('bg-gray-700/50 text-gray-200');
        });
    });

    describe('calculateHighestImpact', () => {
        const mockDamageScenarios: DamageScenario[] = [
            {
                id: 'ds1',
                name: 'Scenario 1',
                description: 'Test scenario 1',
                impactCategory: 'Safety',
                impact: Impact.NEGLIGIBLE,
                reasoning: 'Test',
                comment: '',
            },
            {
                id: 'ds2',
                name: 'Scenario 2',
                description: 'Test scenario 2',
                impactCategory: 'Financial',
                impact: Impact.MODERATE,
                reasoning: 'Test',
                comment: '',
            },
            {
                id: 'ds3',
                name: 'Scenario 3',
                description: 'Test scenario 3',
                impactCategory: 'Privacy',
                impact: Impact.SEVERE,
                reasoning: 'Test',
                comment: '',
            },
            {
                id: 'ds4',
                name: 'Scenario 4',
                description: 'Test scenario 4',
                impactCategory: 'Safety',
                impact: Impact.MAJOR,
                reasoning: 'Test',
                comment: '',
            },
        ];

        it('should return NEGLIGIBLE for empty selection', () => {
            expect(calculateHighestImpact([], mockDamageScenarios)).toBe(Impact.NEGLIGIBLE);
        });

        it('should return highest impact from selected scenarios', () => {
            expect(calculateHighestImpact(['ds1', 'ds2'], mockDamageScenarios))
                .toBe(Impact.MODERATE);
        });

        it('should return SEVERE when it is the highest', () => {
            expect(calculateHighestImpact(['ds1', 'ds2', 'ds3'], mockDamageScenarios))
                .toBe(Impact.SEVERE);
        });

        it('should return MAJOR when selected', () => {
            expect(calculateHighestImpact(['ds1', 'ds4'], mockDamageScenarios))
                .toBe(Impact.MAJOR);
        });

        it('should return NEGLIGIBLE when only NEGLIGIBLE scenarios selected', () => {
            expect(calculateHighestImpact(['ds1'], mockDamageScenarios))
                .toBe(Impact.NEGLIGIBLE);
        });

        it('should handle all scenarios selected', () => {
            expect(calculateHighestImpact(['ds1', 'ds2', 'ds3', 'ds4'], mockDamageScenarios))
                .toBe(Impact.SEVERE);
        });

        it('should ignore non-existent damage scenario IDs', () => {
            expect(calculateHighestImpact(['nonexistent', 'ds2'], mockDamageScenarios))
                .toBe(Impact.MODERATE);
        });

        it('should return NEGLIGIBLE when all IDs are non-existent', () => {
            expect(calculateHighestImpact(['nonexistent1', 'nonexistent2'], mockDamageScenarios))
                .toBe(Impact.NEGLIGIBLE);
        });
    });

    describe('calculateRiskLevel', () => {
        describe('HIGH feasibility', () => {
            it('should return NEGLIGIBLE for NEGLIGIBLE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.HIGH, Impact.NEGLIGIBLE))
                    .toBe(RiskLevel.NEGLIGIBLE);
            });

            it('should return MEDIUM for MODERATE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.HIGH, Impact.MODERATE))
                    .toBe(RiskLevel.MEDIUM);
            });

            it('should return HIGH for MAJOR impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.HIGH, Impact.MAJOR))
                    .toBe(RiskLevel.HIGH);
            });

            it('should return CRITICAL for SEVERE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.HIGH, Impact.SEVERE))
                    .toBe(RiskLevel.CRITICAL);
            });
        });

        describe('MEDIUM feasibility', () => {
            it('should return NEGLIGIBLE for NEGLIGIBLE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.MEDIUM, Impact.NEGLIGIBLE))
                    .toBe(RiskLevel.NEGLIGIBLE);
            });

            it('should return LOW for MODERATE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.MEDIUM, Impact.MODERATE))
                    .toBe(RiskLevel.LOW);
            });

            it('should return MEDIUM for MAJOR impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.MEDIUM, Impact.MAJOR))
                    .toBe(RiskLevel.MEDIUM);
            });

            it('should return HIGH for SEVERE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.MEDIUM, Impact.SEVERE))
                    .toBe(RiskLevel.HIGH);
            });
        });

        describe('LOW feasibility', () => {
            it('should return NEGLIGIBLE for NEGLIGIBLE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.LOW, Impact.NEGLIGIBLE))
                    .toBe(RiskLevel.NEGLIGIBLE);
            });

            it('should return LOW for MODERATE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.LOW, Impact.MODERATE))
                    .toBe(RiskLevel.LOW);
            });

            it('should return LOW for MAJOR impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.LOW, Impact.MAJOR))
                    .toBe(RiskLevel.LOW);
            });

            it('should return MEDIUM for SEVERE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.LOW, Impact.SEVERE))
                    .toBe(RiskLevel.MEDIUM);
            });
        });

        describe('VERY_LOW feasibility', () => {
            it('should return NEGLIGIBLE for NEGLIGIBLE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.VERY_LOW, Impact.NEGLIGIBLE))
                    .toBe(RiskLevel.NEGLIGIBLE);
            });

            it('should return NEGLIGIBLE for MODERATE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.VERY_LOW, Impact.MODERATE))
                    .toBe(RiskLevel.NEGLIGIBLE);
            });

            it('should return NEGLIGIBLE for MAJOR impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.VERY_LOW, Impact.MAJOR))
                    .toBe(RiskLevel.NEGLIGIBLE);
            });

            it('should return LOW for SEVERE impact', () => {
                expect(calculateRiskLevel(AttackFeasibilityRating.VERY_LOW, Impact.SEVERE))
                    .toBe(RiskLevel.LOW);
            });
        });

        it('should return NEGLIGIBLE for invalid input', () => {
            expect(calculateRiskLevel('INVALID' as any, 'INVALID' as any))
                .toBe(RiskLevel.NEGLIGIBLE);
        });
    });

    describe('getRiskColor', () => {
        it('should return gray for NEGLIGIBLE risk', () => {
            expect(getRiskColor(RiskLevel.NEGLIGIBLE)).toBe('bg-gray-600');
        });

        it('should return green for LOW risk', () => {
            expect(getRiskColor(RiskLevel.LOW)).toBe('bg-green-600');
        });

        it('should return yellow for MEDIUM risk', () => {
            expect(getRiskColor(RiskLevel.MEDIUM)).toBe('bg-yellow-500');
        });

        it('should return orange for HIGH risk', () => {
            expect(getRiskColor(RiskLevel.HIGH)).toBe('bg-orange-500');
        });

        it('should return red for CRITICAL risk', () => {
            expect(getRiskColor(RiskLevel.CRITICAL)).toBe('bg-red-700');
        });

        it('should return gray for unknown risk level', () => {
            expect(getRiskColor('UNKNOWN' as any)).toBe('bg-gray-600');
        });
    });

    describe('riskLevelOrder', () => {
        it('should have correct ordering values', () => {
            expect(riskLevelOrder[RiskLevel.NEGLIGIBLE]).toBe(1);
            expect(riskLevelOrder[RiskLevel.LOW]).toBe(2);
            expect(riskLevelOrder[RiskLevel.MEDIUM]).toBe(3);
            expect(riskLevelOrder[RiskLevel.HIGH]).toBe(4);
            expect(riskLevelOrder[RiskLevel.CRITICAL]).toBe(5);
        });

        it('should allow proper comparison of risk levels', () => {
            expect(riskLevelOrder[RiskLevel.CRITICAL])
                .toBeGreaterThan(riskLevelOrder[RiskLevel.HIGH]);
            expect(riskLevelOrder[RiskLevel.HIGH])
                .toBeGreaterThan(riskLevelOrder[RiskLevel.MEDIUM]);
            expect(riskLevelOrder[RiskLevel.MEDIUM])
                .toBeGreaterThan(riskLevelOrder[RiskLevel.LOW]);
            expect(riskLevelOrder[RiskLevel.LOW])
                .toBeGreaterThan(riskLevelOrder[RiskLevel.NEGLIGIBLE]);
        });
    });

    describe('Integration: Full risk calculation workflow', () => {
        it('should calculate complete risk assessment from AP to risk level', () => {
            // Scenario: High attack potential (easy to execute)
            const attackPotential: AttackPotentialTuple = {
                time: 2,
                expertise: 2,
                knowledge: 3,
                access: 2,
                equipment: 3,
            };

            const ap = calculateAP(attackPotential);
            expect(ap).toBe(12);

            const feasibility = getAttackFeasibilityRating(ap);
            expect(feasibility).toBe(AttackFeasibilityRating.HIGH);

            const riskLevel = calculateRiskLevel(feasibility, Impact.SEVERE);
            expect(riskLevel).toBe(RiskLevel.CRITICAL);

            const color = getRiskColor(riskLevel);
            expect(color).toBe('bg-red-700');
        });

        it('should calculate low risk for difficult attacks with low impact', () => {
            // Scenario: Very difficult attack with negligible impact
            const attackPotential: AttackPotentialTuple = {
                time: 6,
                expertise: 6,
                knowledge: 6,
                access: 6,
                equipment: 6,
            };

            const ap = calculateAP(attackPotential);
            expect(ap).toBe(30);

            const feasibility = getAttackFeasibilityRating(ap);
            expect(feasibility).toBe(AttackFeasibilityRating.VERY_LOW);

            const riskLevel = calculateRiskLevel(feasibility, Impact.NEGLIGIBLE);
            expect(riskLevel).toBe(RiskLevel.NEGLIGIBLE);

            const color = getRiskColor(riskLevel);
            expect(color).toBe('bg-gray-600');
        });

        it('should handle medium risk scenario', () => {
            // Scenario: Medium difficulty attack with major impact
            const attackPotential: AttackPotentialTuple = {
                time: 3,
                expertise: 3,
                knowledge: 4,
                access: 3,
                equipment: 4,
            };

            const ap = calculateAP(attackPotential);
            expect(ap).toBe(17);

            const feasibility = getAttackFeasibilityRating(ap);
            expect(feasibility).toBe(AttackFeasibilityRating.MEDIUM);

            const riskLevel = calculateRiskLevel(feasibility, Impact.MAJOR);
            expect(riskLevel).toBe(RiskLevel.MEDIUM);

            const color = getRiskColor(riskLevel);
            expect(color).toBe('bg-yellow-500');
        });

        it('should handle infeasible attack paths', () => {
            const attackPotential: AttackPotentialTuple = {
                time: 99,
                expertise: 2,
                knowledge: 2,
                access: 2,
                equipment: 2,
            };

            const ap = calculateAP(attackPotential);
            expect(ap).toBe(99);

            // Infeasible attacks should result in very low feasibility
            const feasibility = getAttackFeasibilityRating(ap);
            expect(feasibility).toBe(AttackFeasibilityRating.VERY_LOW);
        });
    });

    describe('Edge cases and boundary conditions', () => {
        it('should handle damage scenarios with highest impact', () => {
            const scenarios: DamageScenario[] = [
                {
                    id: 'ds1',
                    name: 'Critical',
                    description: 'Critical scenario',
                    impactCategory: 'Safety',
                    impact: Impact.SEVERE,
                    reasoning: '',
                    comment: '',
                },
                {
                    id: 'ds2',
                    name: 'Also Critical',
                    description: 'Another critical scenario',
                    impactCategory: 'Privacy',
                    impact: Impact.SEVERE,
                    reasoning: '',
                    comment: '',
                },
            ];

            const highestImpact = calculateHighestImpact(['ds1', 'ds2'], scenarios);
            expect(highestImpact).toBe(Impact.SEVERE);
        });

        it('should handle AP calculation with mixed values', () => {
            const potential: AttackPotentialTuple = {
                time: 0,
                expertise: 10,
                knowledge: 5,
                access: 0,
                equipment: 8,
            };
            expect(calculateAP(potential)).toBe(23);
        });

        it('should correctly map all risk matrix combinations', () => {
            // Test all 16 combinations of the risk matrix
            const combinations = [
                { feasibility: AttackFeasibilityRating.HIGH, impact: Impact.NEGLIGIBLE, expected: RiskLevel.NEGLIGIBLE },
                { feasibility: AttackFeasibilityRating.HIGH, impact: Impact.MODERATE, expected: RiskLevel.MEDIUM },
                { feasibility: AttackFeasibilityRating.HIGH, impact: Impact.MAJOR, expected: RiskLevel.HIGH },
                { feasibility: AttackFeasibilityRating.HIGH, impact: Impact.SEVERE, expected: RiskLevel.CRITICAL },

                { feasibility: AttackFeasibilityRating.MEDIUM, impact: Impact.NEGLIGIBLE, expected: RiskLevel.NEGLIGIBLE },
                { feasibility: AttackFeasibilityRating.MEDIUM, impact: Impact.MODERATE, expected: RiskLevel.LOW },
                { feasibility: AttackFeasibilityRating.MEDIUM, impact: Impact.MAJOR, expected: RiskLevel.MEDIUM },
                { feasibility: AttackFeasibilityRating.MEDIUM, impact: Impact.SEVERE, expected: RiskLevel.HIGH },

                { feasibility: AttackFeasibilityRating.LOW, impact: Impact.NEGLIGIBLE, expected: RiskLevel.NEGLIGIBLE },
                { feasibility: AttackFeasibilityRating.LOW, impact: Impact.MODERATE, expected: RiskLevel.LOW },
                { feasibility: AttackFeasibilityRating.LOW, impact: Impact.MAJOR, expected: RiskLevel.LOW },
                { feasibility: AttackFeasibilityRating.LOW, impact: Impact.SEVERE, expected: RiskLevel.MEDIUM },

                { feasibility: AttackFeasibilityRating.VERY_LOW, impact: Impact.NEGLIGIBLE, expected: RiskLevel.NEGLIGIBLE },
                { feasibility: AttackFeasibilityRating.VERY_LOW, impact: Impact.MODERATE, expected: RiskLevel.NEGLIGIBLE },
                { feasibility: AttackFeasibilityRating.VERY_LOW, impact: Impact.MAJOR, expected: RiskLevel.NEGLIGIBLE },
                { feasibility: AttackFeasibilityRating.VERY_LOW, impact: Impact.SEVERE, expected: RiskLevel.LOW },
            ];

            combinations.forEach(({ feasibility, impact, expected }) => {
                expect(calculateRiskLevel(feasibility, impact)).toBe(expected);
            });
        });
    });
});
