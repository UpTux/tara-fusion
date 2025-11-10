import {
    Project,
    RiskTreatmentDecision
} from '../types';

export enum RequirementSeverity {
    CRITICAL = 'Critical',
    MAJOR = 'Major',
    MINOR = 'Minor',
    INFO = 'Info',
}

export interface RequirementViolation {
    requirementId: string;
    requirement: string;
    severity: RequirementSeverity;
    message: string;
    affectedItems?: string[];
}

export interface RequirementCheckResult {
    passed: boolean;
    totalChecks: number;
    violations: RequirementViolation[];
    criticalCount: number;
    majorCount: number;
    minorCount: number;
    infoCount: number;
}

/**
 * Validates a TARA project against all defined requirements
 */
export function validateProjectRequirements(project: Project): RequirementCheckResult {
    const violations: RequirementViolation[] = [];

    // REQ-TOE-001: TOE Definition
    checkTOEDefinition(project, violations);

    // REQ-DATA-100-102: TOE Description Entity
    checkTOEDescriptionEntity(project, violations);

    // REQ-IMP-001-004: Impact Determination
    checkImpactDetermination(project, violations);

    // REQ-ATT-001-005: Attack Feasibility Evaluation
    checkAttackFeasibilityEvaluation(project, violations);

    // REQ-RSK-001-006: Risk Determination and Treatment
    checkRiskDeterminationAndTreatment(project, violations);

    // REQ-DATA-200-202: Security Objectives, Assets, and Misuse Cases
    checkSecurityObjectivesAndAssets(project, violations);

    // REQ-DATA-300-302: Threat and Threat Scenarios
    checkThreatAndThreatScenarios(project, violations);

    // REQ-DATA-400-403: Attack Feasibility and Risk Calculation
    checkAttackFeasibilityAndRiskCalculation(project, violations);

    // REQ-DATA-500: Damage Scenarios and Impact
    checkDamageScenariosAndImpact(project, violations);

    // REQ-DATA-600-604: Risk Treatment and Controls
    checkRiskTreatmentAndControls(project, violations);

    // Count violations by severity
    const criticalCount = violations.filter(v => v.severity === RequirementSeverity.CRITICAL).length;
    const majorCount = violations.filter(v => v.severity === RequirementSeverity.MAJOR).length;
    const minorCount = violations.filter(v => v.severity === RequirementSeverity.MINOR).length;
    const infoCount = violations.filter(v => v.severity === RequirementSeverity.INFO).length;

    return {
        passed: violations.length === 0,
        totalChecks: violations.length,
        violations,
        criticalCount,
        majorCount,
        minorCount,
        infoCount,
    };
}

function checkTOEDefinition(project: Project, violations: RequirementViolation[]): void {
    // REQ-TOE-001: TOE must be defined
    if (!project.toeDescription || project.toeDescription.trim() === '') {
        violations.push({
            requirementId: 'REQ-TOE-001',
            requirement: 'The risk analysis system shall define the Target of Evaluation (TOE)',
            severity: RequirementSeverity.CRITICAL,
            message: 'TOE Description is missing. The Target of Evaluation must be clearly defined.',
        });
    }
}

function checkTOEDescriptionEntity(project: Project, violations: RequirementViolation[]): void {
    // REQ-DATA-100: Singular TOE description entity (always true in our data model)

    // REQ-DATA-101: TOE description includes scope, assumptions, and configuration
    if (!project.scope || project.scope.trim() === '') {
        violations.push({
            requirementId: 'REQ-DATA-101',
            requirement: 'TOE description must include scope',
            severity: RequirementSeverity.MAJOR,
            message: 'Scope is not defined.',
        });
    }

    if (!project.assumptions || project.assumptions.length === 0) {
        violations.push({
            requirementId: 'REQ-DATA-101',
            requirement: 'TOE description must include assumptions',
            severity: RequirementSeverity.MAJOR,
            message: 'No assumptions have been documented.',
        });
    }

    if (!project.toeConfigurations || project.toeConfigurations.length === 0) {
        violations.push({
            requirementId: 'REQ-DATA-101',
            requirement: 'TOE description must include TOE configuration',
            severity: RequirementSeverity.MAJOR,
            message: 'No TOE configurations have been defined.',
        });
    }

    // REQ-DATA-102: Initial and residual risk entities
    // This is implicitly satisfied by having threats with initialAFR and residualAFR
    const hasThreatsWithRisk = (project.threats || []).length > 0;
    if (!hasThreatsWithRisk) {
        violations.push({
            requirementId: 'REQ-DATA-102',
            requirement: 'System must maintain initial risk and residual risk entities',
            severity: RequirementSeverity.INFO,
            message: 'No threats defined yet, initial and residual risk tracking will begin once threats are added.',
        });
    }
}

function checkImpactDetermination(project: Project, violations: RequirementViolation[]): void {
    // REQ-IMP-001: Identify and document damage scenarios
    if (!project.damageScenarios || project.damageScenarios.length === 0) {
        violations.push({
            requirementId: 'REQ-IMP-001',
            requirement: 'System shall identify and document all potential damage scenarios',
            severity: RequirementSeverity.CRITICAL,
            message: 'No damage scenarios have been identified.',
        });
        return;
    }

    // REQ-IMP-002: Each damage scenario must have at least one impact category
    // REQ-IMP-003: Each damage scenario must have impact rating
    // REQ-IMP-004: Each damage scenario should have single impact category
    const damageScenariosWithoutCategory: string[] = [];
    const damageScenariosWithoutImpact: string[] = [];

    project.damageScenarios.forEach(ds => {
        if (!ds.impactCategory || ds.impactCategory.trim() === '') {
            damageScenariosWithoutCategory.push(ds.id);
        }
        if (!ds.impact) {
            damageScenariosWithoutImpact.push(ds.id);
        }
    });

    if (damageScenariosWithoutCategory.length > 0) {
        violations.push({
            requirementId: 'REQ-IMP-002',
            requirement: 'Each damage scenario must have at least one impact category',
            severity: RequirementSeverity.MAJOR,
            message: `${damageScenariosWithoutCategory.length} damage scenario(s) missing impact category.`,
            affectedItems: damageScenariosWithoutCategory,
        });
    }

    if (damageScenariosWithoutImpact.length > 0) {
        violations.push({
            requirementId: 'REQ-IMP-003',
            requirement: 'Each damage scenario must have an impact rating',
            severity: RequirementSeverity.MAJOR,
            message: `${damageScenariosWithoutImpact.length} damage scenario(s) missing impact rating.`,
            affectedItems: damageScenariosWithoutImpact,
        });
    }
}

function checkAttackFeasibilityEvaluation(project: Project, violations: RequirementViolation[]): void {
    // REQ-ATT-001: Identify and document assets
    if (!project.assets || project.assets.length === 0) {
        violations.push({
            requirementId: 'REQ-ATT-001',
            requirement: 'System shall identify and document all assets',
            severity: RequirementSeverity.CRITICAL,
            message: 'No assets have been identified.',
        });
        return;
    }

    // REQ-ATT-002: Define security objectives (asset + security property combinations)
    const assetsWithoutSecurityProperties: string[] = [];
    project.assets.forEach(asset => {
        if (!asset.securityProperties || asset.securityProperties.length === 0) {
            assetsWithoutSecurityProperties.push(asset.id);
        }
    });

    if (assetsWithoutSecurityProperties.length > 0) {
        violations.push({
            requirementId: 'REQ-ATT-002',
            requirement: 'Define security objectives by combining assets with security properties',
            severity: RequirementSeverity.MAJOR,
            message: `${assetsWithoutSecurityProperties.length} asset(s) missing security properties.`,
            affectedItems: assetsWithoutSecurityProperties,
        });
    }

    // REQ-ATT-003: Formulate at least one threat for each security objective
    const securityObjectives = new Set<string>();
    const threatenedObjectives = new Set<string>();

    project.assets.forEach(asset => {
        asset.securityProperties.forEach(prop => {
            securityObjectives.add(`${asset.id}:${prop}`);
        });
    });

    (project.threats || []).forEach(threat => {
        threatenedObjectives.add(`${threat.assetId}:${threat.securityProperty}`);
    });

    const unthreatenedObjectives: string[] = [];
    securityObjectives.forEach(obj => {
        if (!threatenedObjectives.has(obj)) {
            unthreatenedObjectives.push(obj);
        }
    });

    if (unthreatenedObjectives.length > 0) {
        violations.push({
            requirementId: 'REQ-ATT-003',
            requirement: 'Formulate at least one threat for each security objective',
            severity: RequirementSeverity.MAJOR,
            message: `${unthreatenedObjectives.length} security objective(s) without threats.`,
            affectedItems: unthreatenedObjectives,
        });
    }

    // REQ-ATT-004: Define threat scenario for every threat-damage scenario pairing
    if (!project.threats || project.threats.length === 0) {
        return;
    }

    const threatsWithoutScenarios: string[] = [];
    project.threats.forEach(threat => {
        const scenarios = (project.threatScenarios || []).filter(ts => ts.threatId === threat.id);
        if (scenarios.length === 0) {
            threatsWithoutScenarios.push(threat.id);
        }
    });

    if (threatsWithoutScenarios.length > 0) {
        violations.push({
            requirementId: 'REQ-ATT-004',
            requirement: 'Define threat scenario for every threat-damage scenario pairing',
            severity: RequirementSeverity.MAJOR,
            message: `${threatsWithoutScenarios.length} threat(s) without threat scenarios.`,
            affectedItems: threatsWithoutScenarios,
        });
    }

    // REQ-ATT-005: Determine attack feasibility rating for each threat scenario
    const scenariosWithoutFeasibility: string[] = [];
    (project.threatScenarios || []).forEach(ts => {
        if (!ts.attackPotential ||
            ts.attackPotential.time === undefined ||
            ts.attackPotential.expertise === undefined) {
            scenariosWithoutFeasibility.push(ts.id);
        }
    });

    if (scenariosWithoutFeasibility.length > 0) {
        violations.push({
            requirementId: 'REQ-ATT-005',
            requirement: 'Determine attack feasibility rating for each threat scenario',
            severity: RequirementSeverity.MAJOR,
            message: `${scenariosWithoutFeasibility.length} threat scenario(s) missing attack feasibility rating.`,
            affectedItems: scenariosWithoutFeasibility,
        });
    }
}

function checkRiskDeterminationAndTreatment(project: Project, violations: RequirementViolation[]): void {
    if (!project.threatScenarios || project.threatScenarios.length === 0) {
        return;
    }

    // REQ-RSK-001: Calculate risk level (implicitly done by system)
    // REQ-RSK-002: Assign risk treatment decision for every risk
    const scenariosWithoutTreatment: string[] = [];
    const scenariosReduceWithoutGoals: string[] = [];
    const scenariosShareWithoutClaims: string[] = [];

    project.threatScenarios.forEach(ts => {
        if (!ts.treatmentDecision || ts.treatmentDecision === RiskTreatmentDecision.TBD) {
            scenariosWithoutTreatment.push(ts.id);
        } else {
            // REQ-RSK-003: If Reduce, must link to security goals
            if (ts.treatmentDecision === RiskTreatmentDecision.REDUCE) {
                if (!ts.securityGoalIds || ts.securityGoalIds.length === 0) {
                    scenariosReduceWithoutGoals.push(ts.id);
                }
            }
            // REQ-RSK-004: If Share/Transfer, must link to security claims
            if (ts.treatmentDecision === RiskTreatmentDecision.TRANSFER) {
                if (!ts.securityClaimIds || ts.securityClaimIds.length === 0) {
                    scenariosShareWithoutClaims.push(ts.id);
                }
            }
        }
    });

    if (scenariosWithoutTreatment.length > 0) {
        violations.push({
            requirementId: 'REQ-RSK-002',
            requirement: 'Assign risk treatment decision for every risk',
            severity: RequirementSeverity.MAJOR,
            message: `${scenariosWithoutTreatment.length} threat scenario(s) without treatment decision.`,
            affectedItems: scenariosWithoutTreatment,
        });
    }

    if (scenariosReduceWithoutGoals.length > 0) {
        violations.push({
            requirementId: 'REQ-RSK-003',
            requirement: 'If treatment is Reduce, must link to security goals',
            severity: RequirementSeverity.MAJOR,
            message: `${scenariosReduceWithoutGoals.length} threat scenario(s) with Reduce decision but no linked security goals.`,
            affectedItems: scenariosReduceWithoutGoals,
        });
    }

    if (scenariosShareWithoutClaims.length > 0) {
        violations.push({
            requirementId: 'REQ-RSK-004',
            requirement: 'If treatment is Share, must link to security claims',
            severity: RequirementSeverity.MAJOR,
            message: `${scenariosShareWithoutClaims.length} threat scenario(s) with Transfer decision but no linked security claims.`,
            affectedItems: scenariosShareWithoutClaims,
        });
    }

    // REQ-RSK-005: Derive security controls from security goals
    if (project.securityGoals && project.securityGoals.length > 0) {
        const goalsWithoutControls: string[] = [];
        project.securityGoals.forEach(sg => {
            const hasControl = (project.securityControls || []).some(sc =>
                sc.securityGoalIds.includes(sg.id)
            );
            if (!hasControl) {
                goalsWithoutControls.push(sg.id);
            }
        });

        if (goalsWithoutControls.length > 0) {
            violations.push({
                requirementId: 'REQ-RSK-005',
                requirement: 'Derive security controls from security goals',
                severity: RequirementSeverity.MAJOR,
                message: `${goalsWithoutControls.length} security goal(s) without associated security controls.`,
                affectedItems: goalsWithoutControls,
            });
        }
    }

    // REQ-RSK-006: Document residual risk analysis
    const threatsWithoutResidualRisk: string[] = [];
    (project.threats || []).forEach(threat => {
        if (!threat.residualAFR || threat.residualAFR === 'TBD') {
            threatsWithoutResidualRisk.push(threat.id);
        }
    });

    if (threatsWithoutResidualRisk.length > 0) {
        violations.push({
            requirementId: 'REQ-RSK-006',
            requirement: 'Document residual risk analysis',
            severity: RequirementSeverity.MINOR,
            message: `${threatsWithoutResidualRisk.length} threat(s) without residual risk assessment.`,
            affectedItems: threatsWithoutResidualRisk,
        });
    }
}

function checkSecurityObjectivesAndAssets(project: Project, violations: RequirementViolation[]): void {
    // REQ-DATA-200-201: Security objectives are assets + security properties
    // Already covered in REQ-ATT-002

    // REQ-DATA-202: Optional misuse cases can be associated with assets
    // This is optional, so no violations
}

function checkThreatAndThreatScenarios(project: Project, violations: RequirementViolation[]): void {
    // REQ-DATA-300: Each threat linked to exactly one security objective (asset + property)
    const threatsWithoutAsset: string[] = [];
    const threatsWithoutProperty: string[] = [];

    (project.threats || []).forEach(threat => {
        if (!threat.assetId) {
            threatsWithoutAsset.push(threat.id);
        }
        if (!threat.securityProperty) {
            threatsWithoutProperty.push(threat.id);
        }
    });

    if (threatsWithoutAsset.length > 0) {
        violations.push({
            requirementId: 'REQ-DATA-300',
            requirement: 'Each threat must be linked to a security objective (asset)',
            severity: RequirementSeverity.CRITICAL,
            message: `${threatsWithoutAsset.length} threat(s) without linked asset.`,
            affectedItems: threatsWithoutAsset,
        });
    }

    if (threatsWithoutProperty.length > 0) {
        violations.push({
            requirementId: 'REQ-DATA-300',
            requirement: 'Each threat must be linked to a security objective (property)',
            severity: RequirementSeverity.CRITICAL,
            message: `${threatsWithoutProperty.length} threat(s) without security property.`,
            affectedItems: threatsWithoutProperty,
        });
    }

    // REQ-DATA-301: Each threat scenario linked to exactly one threat
    const scenariosWithoutThreat: string[] = [];
    (project.threatScenarios || []).forEach(ts => {
        if (!ts.threatId) {
            scenariosWithoutThreat.push(ts.id);
        }
    });

    if (scenariosWithoutThreat.length > 0) {
        violations.push({
            requirementId: 'REQ-DATA-301',
            requirement: 'Each threat scenario must be linked to exactly one threat',
            severity: RequirementSeverity.CRITICAL,
            message: `${scenariosWithoutThreat.length} threat scenario(s) without linked threat.`,
            affectedItems: scenariosWithoutThreat,
        });
    }

    // REQ-DATA-302: Each threat scenario linked to one or more damage scenarios
    const scenariosWithoutDamageScenarios: string[] = [];
    (project.threatScenarios || []).forEach(ts => {
        if (!ts.damageScenarioIds || ts.damageScenarioIds.length === 0) {
            scenariosWithoutDamageScenarios.push(ts.id);
        }
    });

    if (scenariosWithoutDamageScenarios.length > 0) {
        violations.push({
            requirementId: 'REQ-DATA-302',
            requirement: 'Each threat scenario must be linked to one or more damage scenarios',
            severity: RequirementSeverity.CRITICAL,
            message: `${scenariosWithoutDamageScenarios.length} threat scenario(s) without linked damage scenarios.`,
            affectedItems: scenariosWithoutDamageScenarios,
        });
    }
}

function checkAttackFeasibilityAndRiskCalculation(project: Project, violations: RequirementViolation[]): void {
    // REQ-DATA-400: Each threat associated with initial attack tree/feasibility
    const threatsWithoutInitialAFR: string[] = [];
    (project.threats || []).forEach(threat => {
        if (!threat.initialAFR || threat.initialAFR === 'TBD') {
            threatsWithoutInitialAFR.push(threat.id);
        }
    });

    if (threatsWithoutInitialAFR.length > 0) {
        violations.push({
            requirementId: 'REQ-DATA-400',
            requirement: 'Each threat must have initial attack feasibility assessment',
            severity: RequirementSeverity.MAJOR,
            message: `${threatsWithoutInitialAFR.length} threat(s) without initial attack feasibility rating.`,
            affectedItems: threatsWithoutInitialAFR,
        });
    }

    // REQ-DATA-401: Residual attack trees are optional but recommended
    // REQ-DATA-402-403: Risk calculation (implicitly done by system)
}

function checkDamageScenariosAndImpact(project: Project, violations: RequirementViolation[]): void {
    // REQ-DATA-500: Each damage scenario linked to one impact category and rating
    // Already covered in checkImpactDetermination
}

function checkRiskTreatmentAndControls(project: Project, violations: RequirementViolation[]): void {
    // REQ-DATA-600: Treatment strategy defined
    // Already covered in checkRiskDeterminationAndTreatment

    // REQ-DATA-601: Share/Retain must link to security claims
    const scenariosRetainWithoutClaims: string[] = [];
    (project.threatScenarios || []).forEach(ts => {
        if (ts.treatmentDecision === RiskTreatmentDecision.ACCEPT) {
            if (!ts.securityClaimIds || ts.securityClaimIds.length === 0) {
                scenariosRetainWithoutClaims.push(ts.id);
            }
        }
    });

    if (scenariosRetainWithoutClaims.length > 0) {
        violations.push({
            requirementId: 'REQ-DATA-601',
            requirement: 'If treatment is Accept/Retain, should link to security claims',
            severity: RequirementSeverity.MINOR,
            message: `${scenariosRetainWithoutClaims.length} threat scenario(s) with Accept decision but no linked security claims (optional but recommended).`,
            affectedItems: scenariosRetainWithoutClaims,
        });
    }

    // REQ-DATA-602: Reduce must link to security goals
    // Already covered in REQ-RSK-003

    // REQ-DATA-603: Each security goal linked to exactly one security control
    const controlsWithoutGoals: string[] = [];
    (project.securityControls || []).forEach(sc => {
        if (!sc.securityGoalIds || sc.securityGoalIds.length === 0) {
            controlsWithoutGoals.push(sc.id);
        }
    });

    if (controlsWithoutGoals.length > 0) {
        violations.push({
            requirementId: 'REQ-DATA-603',
            requirement: 'Each security control must be linked to at least one security goal',
            severity: RequirementSeverity.MAJOR,
            message: `${controlsWithoutGoals.length} security control(s) without linked security goals.`,
            affectedItems: controlsWithoutGoals,
        });
    }

    // REQ-DATA-604: Security controls can have circumvent trees (optional)
    // This is optional, no validation needed
}

/**
 * Groups violations by severity for easier display
 */
export function groupViolationsBySeverity(violations: RequirementViolation[]): {
    critical: RequirementViolation[];
    major: RequirementViolation[];
    minor: RequirementViolation[];
    info: RequirementViolation[];
} {
    return {
        critical: violations.filter(v => v.severity === RequirementSeverity.CRITICAL),
        major: violations.filter(v => v.severity === RequirementSeverity.MAJOR),
        minor: violations.filter(v => v.severity === RequirementSeverity.MINOR),
        info: violations.filter(v => v.severity === RequirementSeverity.INFO),
    };
}

/**
 * Generates a summary report of the requirements check
 */
export function generateRequirementsSummary(result: RequirementCheckResult): string {
    if (result.passed) {
        return '✅ All requirements satisfied! The TARA analysis is complete and compliant.';
    }

    const lines: string[] = [];
    lines.push(`Requirements Check Summary: ${result.totalChecks} issue(s) found`);
    lines.push('');

    if (result.criticalCount > 0) {
        lines.push(`🔴 Critical: ${result.criticalCount} - Must be resolved`);
    }
    if (result.majorCount > 0) {
        lines.push(`🟠 Major: ${result.majorCount} - Should be resolved`);
    }
    if (result.minorCount > 0) {
        lines.push(`🟡 Minor: ${result.minorCount} - Recommended to resolve`);
    }
    if (result.infoCount > 0) {
        lines.push(`ℹ️  Info: ${result.infoCount} - Informational`);
    }

    return lines.join('\n');
}
