import { describe, expect, it } from 'vitest';
import {
    AttackFeasibilityRating,
    Impact,
    Project,
    ProjectStatus,
    RiskTreatmentDecision,
    SecurityProperty
} from '../types';
import {
    RequirementSeverity,
    generateRequirementsSummary,
    groupViolationsBySeverity,
    validateProjectRequirements
} from './requirementsCheckService';

describe('Requirements Check Service', () => {
    const createMinimalProject = (): Project => ({
        id: 'test-proj',
        name: 'Test Project',
        organizationId: 'org-1',
        needs: [],
        projectStatus: ProjectStatus.IN_PROGRESS,
        history: [],
    });

    describe('REQ-TOE-001: TOE Definition', () => {
        it('should fail when TOE description is missing', () => {
            const project = createMinimalProject();
            const result = validateProjectRequirements(project);

            expect(result.passed).toBe(false);
            expect(result.violations.some(v => v.requirementId === 'REQ-TOE-001')).toBe(true);
        });

        it('should pass when TOE description is provided', () => {
            const project = createMinimalProject();
            project.toeDescription = 'Test TOE Description';
            const result = validateProjectRequirements(project);

            const toeViolation = result.violations.find(v => v.requirementId === 'REQ-TOE-001');
            expect(toeViolation).toBeUndefined();
        });
    });

    describe('REQ-DATA-101: TOE Components', () => {
        it('should fail when scope is missing', () => {
            const project = createMinimalProject();
            project.toeDescription = 'Test TOE';
            const result = validateProjectRequirements(project);

            const scopeViolation = result.violations.find(v =>
                v.requirementId === 'REQ-DATA-101' && v.message.includes('Scope')
            );
            expect(scopeViolation).toBeDefined();
        });

        it('should fail when assumptions are missing', () => {
            const project = createMinimalProject();
            project.toeDescription = 'Test TOE';
            project.scope = 'Test Scope';
            const result = validateProjectRequirements(project);

            const assumptionViolation = result.violations.find(v =>
                v.requirementId === 'REQ-DATA-101' && v.message.includes('assumptions')
            );
            expect(assumptionViolation).toBeDefined();
        });
    });

    describe('REQ-IMP-001: Damage Scenarios', () => {
        it('should fail when no damage scenarios exist', () => {
            const project = createMinimalProject();
            const result = validateProjectRequirements(project);

            expect(result.violations.some(v => v.requirementId === 'REQ-IMP-001')).toBe(true);
        });

        it('should pass when damage scenarios exist', () => {
            const project = createMinimalProject();
            project.damageScenarios = [{
                id: 'ds-1',
                name: 'Test Damage',
                description: 'Test',
                impactCategory: 'Safety',
                impact: Impact.MAJOR,
                reasoning: 'Test reasoning',
                comment: 'Test comment',
            }];
            const result = validateProjectRequirements(project);

            expect(result.violations.some(v => v.requirementId === 'REQ-IMP-001')).toBe(false);
        });
    });

    describe('REQ-ATT-001: Assets', () => {
        it('should fail when no assets exist', () => {
            const project = createMinimalProject();
            const result = validateProjectRequirements(project);

            expect(result.violations.some(v => v.requirementId === 'REQ-ATT-001')).toBe(true);
        });
    });

    describe('REQ-ATT-002: Security Objectives', () => {
        it('should fail when assets lack security properties', () => {
            const project = createMinimalProject();
            project.assets = [{
                id: 'asset-1',
                name: 'Test Asset',
                securityProperties: [],
                description: 'Test',
                toeConfigurationIds: [],
                comment: '',
            }];
            const result = validateProjectRequirements(project);

            const violation = result.violations.find(v => v.requirementId === 'REQ-ATT-002');
            expect(violation).toBeDefined();
            expect(violation?.affectedItems).toContain('asset-1');
        });
    });

    describe('REQ-RSK-002: Risk Treatment', () => {
        it('should fail when threat scenarios lack treatment decision', () => {
            const project = createMinimalProject();
            project.threatScenarios = [{
                id: 'ts-1',
                name: 'Test Scenario',
                description: 'Test',
                threatId: 'thr-1',
                damageScenarioIds: ['ds-1'],
                attackPotential: { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 },
                comment: '',
            }];
            const result = validateProjectRequirements(project);

            const violation = result.violations.find(v => v.requirementId === 'REQ-RSK-002');
            expect(violation).toBeDefined();
        });

        it('should pass when threat scenarios have treatment decisions', () => {
            const project = createMinimalProject();
            project.threatScenarios = [{
                id: 'ts-1',
                name: 'Test Scenario',
                description: 'Test',
                threatId: 'thr-1',
                damageScenarioIds: ['ds-1'],
                attackPotential: { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 },
                comment: '',
                treatmentDecision: RiskTreatmentDecision.ACCEPT,
            }];
            const result = validateProjectRequirements(project);

            const violation = result.violations.find(v => v.requirementId === 'REQ-RSK-002');
            expect(violation).toBeUndefined();
        });
    });

    describe('REQ-RSK-003: Reduce Treatment Must Link to Goals', () => {
        it('should fail when Reduce treatment lacks security goals', () => {
            const project = createMinimalProject();
            project.threatScenarios = [{
                id: 'ts-1',
                name: 'Test Scenario',
                description: 'Test',
                threatId: 'thr-1',
                damageScenarioIds: ['ds-1'],
                attackPotential: { time: 1, expertise: 1, knowledge: 1, access: 1, equipment: 1 },
                comment: '',
                treatmentDecision: RiskTreatmentDecision.REDUCE,
                securityGoalIds: [],
            }];
            const result = validateProjectRequirements(project);

            const violation = result.violations.find(v => v.requirementId === 'REQ-RSK-003');
            expect(violation).toBeDefined();
        });
    });

    describe('Severity Grouping', () => {
        it('should correctly group violations by severity', () => {
            const project = createMinimalProject();
            const result = validateProjectRequirements(project);
            const grouped = groupViolationsBySeverity(result.violations);

            expect(grouped.critical.every(v => v.severity === RequirementSeverity.CRITICAL)).toBe(true);
            expect(grouped.major.every(v => v.severity === RequirementSeverity.MAJOR)).toBe(true);
            expect(grouped.minor.every(v => v.severity === RequirementSeverity.MINOR)).toBe(true);
            expect(grouped.info.every(v => v.severity === RequirementSeverity.INFO)).toBe(true);
        });
    });

    describe('Summary Generation', () => {
        it('should generate success summary when all requirements pass', () => {
            const result = {
                passed: true,
                totalChecks: 0,
                violations: [],
                criticalCount: 0,
                majorCount: 0,
                minorCount: 0,
                infoCount: 0,
            };
            const summary = generateRequirementsSummary(result);

            expect(summary).toContain('All requirements satisfied');
        });

        it('should generate failure summary with counts', () => {
            const project = createMinimalProject();
            const result = validateProjectRequirements(project);
            const summary = generateRequirementsSummary(result);

            expect(summary).toContain('issue(s) found');
            if (result.criticalCount > 0) {
                expect(summary).toContain('Critical');
            }
        });
    });

    describe('Complete TARA Project', () => {
        it('should pass validation for a complete project', () => {
            const project = createMinimalProject();

            // Complete TOE definition
            project.toeDescription = 'Complete TOE Description';
            project.scope = 'Complete Scope';
            project.assumptions = [{
                id: 'ass-1',
                name: 'Assumption 1',
                active: true,
                toeConfigurationIds: ['cfg-1'],
                comment: 'Test assumption',
            }];
            project.toeConfigurations = [{
                id: 'cfg-1',
                name: 'Config 1',
                active: true,
                description: 'Test config',
                comment: 'Test',
            }];

            // Complete damage scenarios
            project.damageScenarios = [{
                id: 'ds-1',
                name: 'Damage 1',
                description: 'Test damage',
                impactCategory: 'Safety',
                impact: Impact.MAJOR,
                reasoning: 'Test',
                comment: 'Test',
            }];

            // Complete assets
            project.assets = [{
                id: 'asset-1',
                name: 'Asset 1',
                securityProperties: [SecurityProperty.CONFIDENTIALITY],
                description: 'Test asset',
                toeConfigurationIds: ['cfg-1'],
                comment: 'Test',
            }];

            // Complete threats
            project.threats = [{
                id: 'thr-1',
                name: 'Threat 1',
                assetId: 'asset-1',
                securityProperty: SecurityProperty.CONFIDENTIALITY,
                damageScenarioIds: ['ds-1'],
                scales: false,
                reasoningScaling: 'Test',
                comment: 'Test',
                initialAFR: AttackFeasibilityRating.MEDIUM,
                residualAFR: AttackFeasibilityRating.LOW,
            }];

            // Complete threat scenarios
            project.threatScenarios = [{
                id: 'ts-1',
                name: 'Scenario 1',
                description: 'Test scenario',
                threatId: 'thr-1',
                damageScenarioIds: ['ds-1'],
                attackPotential: { time: 5, expertise: 3, knowledge: 3, access: 2, equipment: 2 },
                comment: 'Test',
                treatmentDecision: RiskTreatmentDecision.REDUCE,
                securityGoalIds: ['sg-1'],
            }];

            // Complete security goals
            project.securityGoals = [{
                id: 'sg-1',
                name: 'Goal 1',
                responsible: 'Team',
                requirementsLink: 'REQ-001',
                comment: 'Test',
            }];

            // Complete security controls
            project.securityControls = [{
                id: 'sc-1',
                name: 'Control 1',
                active: true,
                activeRRA: false,
                description: 'Test control',
                securityGoalIds: ['sg-1'],
                comment: 'Test',
            }];

            const result = validateProjectRequirements(project);

            expect(result.passed).toBe(true);
            expect(result.violations).toHaveLength(0);
        });
    });
});
