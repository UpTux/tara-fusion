

export enum NeedType {
  REQUIREMENT = 'req',
  SPECIFICATION = 'spec',
  IMPLEMENTATION = 'impl',
  TEST_CASE = 'test',
  FEATURE = 'feat',
  NEED = 'need',
  ISSUE = 'issue',
  RISK = 'risk',
  ACTION = 'action',
  ATTACK = 'attack',
  MITIGATION = 'mitigation',
}

export enum NeedStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
  IMPLEMENTED = 'implemented',
  REVIEWED = 'reviewed',
  DONE = 'done',
}

export enum ProjectStatus {
  IN_PROGRESS = 'In Progress',
  IN_REVIEW = 'In Review',
  IN_VETO = 'In Veto',
  READY_FOR_RELEASE = 'Ready for Release',
  RELEASED = 'Released',
}

export enum SecurityProperty {
  CONFIDENTIALITY = 'Confidentiality',
  INTEGRITY = 'Integrity',
  AVAILABILITY = 'Availability',
  AUTHENTICITY = 'Authenticity',
  CORRECTNESS = 'Correctness',
  FRESHNESS = 'Freshness',
  AUTHORIZATION = 'Authorization',
  NON_REPUDIATION = 'Non-repudiation',
}

export enum Impact {
  SEVERE = 'Severe',
  MAJOR = 'Major',
  MODERATE = 'Moderate',
  NEGLIGIBLE = 'Negligible',
}

export interface AttackPotentialTuple {
  time: number;
  expertise: number;
  knowledge: number;
  access: number;
  equipment: number;
}

export enum AttackFeasibilityRating {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  VERY_LOW = 'Very Low',
}

export enum RiskLevel {
  NEGLIGIBLE = 'Negligible',
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum AttackerType {
  NONE = 'None',
  EXPERT = 'Expert Attacker',
  ADVANCED = 'Advanced Attacker',
  PRO_WORKSHOP = 'Professional Workshop',
  LOCAL_LAYMAN = 'Local Layman',
  REMOTE_SCRIPT_KIDDY = 'Remote Script Kiddy',
}

export interface SphinxNeed {
  id: string;
  type: NeedType;
  title: string;
  description: string;
  status: NeedStatus;
  tags: string[];
  links: string[];
  logic_gate?: 'AND' | 'OR';
  attackPotential?: AttackPotentialTuple;
  attackerType?: AttackerType;
  toeConfigurationIds?: string[];
  securityControlId?: string;
  // For graphical editor position
  position?: { x: number; y: number };
  [key: string]: unknown; // Allow other custom fields
}

export interface Assumption {
  active: boolean;
  id: string;
  name: string;
  toeConfigurationIds: string[];
  comment: string;
}

export interface ToeConfiguration {
  active: boolean;
  id: string;
  name: string;
  description: string;
  comment: string;
}

export interface SecurityControl {
  active: boolean;
  activeRRA: boolean;
  id: string;
  name: string;
  description: string;
  securityGoalIds: string[];
  comment: string;
}

export interface Asset {
  id: string;
  name: string;
  securityProperties: SecurityProperty[];
  description: string;
  toeConfigurationIds: string[];
  comment: string;
  source?: 'manual' | 'emb3d'; // Track where the asset came from
  emb3dPropertyId?: string; // Reference to the MITRE Emb3d device property ID
}

export interface DamageScenario {
  id: string;
  name: string;
  description: string;
  impactCategory: string;
  impact: Impact;
  reasoning: string; // rst
  comment: string; // rst
}

export interface Threat {
  id: string;
  name: string;
  assetId: string;
  securityProperty: SecurityProperty;
  damageScenarioIds: string[];
  scales: boolean;
  reasoningScaling: string; // rst
  comment: string; // rst
  misuseCaseIds?: string[];
  initialAFR: AttackFeasibilityRating | 'TBD'; // Computed
  residualAFR: AttackFeasibilityRating | 'TBD'; // Computed
  source?: 'manual' | 'emb3d' | 'ai-generated'; // Track the origin of the threat
  emb3dThreatId?: string; // Reference to MITRE Emb3d Threat ID (e.g., TID-101)
}

export enum RiskTreatmentDecision {
  REDUCE = 'Reduce',
  ACCEPT = 'Accept',
  TRANSFER = 'Transfer', // Corresponds to 'Share'
  AVOID = 'Avoid',
  TBD = 'TBD',
}

export interface ThreatScenario {
  id: string;
  name: string;
  description: string; // rst
  threatId: string;
  damageScenarioIds: string[];
  attackPotential: AttackPotentialTuple;
  comment: string; // rst
  treatmentDecision?: RiskTreatmentDecision;
  securityGoalIds?: string[];
  securityClaimIds?: string[];
}

export interface MisuseCase {
  id: string;
  name: string;
  description: string;
  comment: string;
}

export interface SecurityGoal {
  id: string;
  name: string;
  responsible: string;
  requirementsLink: string;
  comment: string; // rst
}

export interface SecurityClaim {
  id: string;
  name: string;
  responsible: string;
  assumptionIds: string[];
  comment: string; // rst
}

export interface ImpactCategorySettings {
  categories: string[];
  justification?: string;
}

export interface Project {
  id: string;
  name: string;
  organizationId: string;
  needs: SphinxNeed[];
  securityManager?: string;
  projectStatus?: ProjectStatus;
  comment?: string;
  history?: string[];
  toeDescription?: string;
  scope?: string;
  assumptions?: Assumption[];
  toeConfigurations?: ToeConfiguration[];
  securityControls?: SecurityControl[];
  assets?: Asset[];
  damageScenarios?: DamageScenario[];
  threats?: Threat[];
  threatScenarios?: ThreatScenario[];
  misuseCases?: MisuseCase[];
  impactCategorySettings?: ImpactCategorySettings;
  securityGoals?: SecurityGoal[];
  securityClaims?: SecurityClaim[];
  managementSummary?: string;
}

export interface Organization {
  id: string;
  name: string;
  impactCategorySettings?: ImpactCategorySettings;
}

// User Management Types
export interface User {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  role: OrganizationRole; // Role in the organization
}

export enum OrganizationRole {
  ORG_ADMIN = 'Organization Admin',
  MEMBER = 'Member',
}

export enum ProjectRole {
  PROJECT_ADMIN = 'Project Admin',
  DESIGNER = 'Designer',
  USER = 'User',
  VIEWER = 'Viewer',
}

export interface ProjectMembership {
  userId: string;
  projectId: string;
  role: ProjectRole;
}


export const projectViews = [
  'Project Cockpit',
  'TOE Description',
  'Scope',
  'Assumptions',
  'TOE Configuration',
  'Attack Filter',
  'Security Controls',
  'Misuse Cases',
  '---',
  'Damage Scenarios',
  'Assets',
  'Threats',
  'Threat Scenarios',
  '---',
  'Attack Trees',
  'Technical Attack Trees',
  'Circumvent Trees',
  'Attack Leaves',
  '---',
  'Security Claims',
  'Security Goals',
  'Risk Treatment',
  '---',
  'Project Users',
  'Traceability Graph',
  'Management Summary',
  'Glossary',
  'Related Documents',
] as const;

export type ProjectViewType = typeof projectViews[number];