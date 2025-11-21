

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
  CONFIDENTIALITY = 'Confidentiality', // REQ-DATA-201 & REQ-DATA-300: Security properties combined with assets form security objectives
  INTEGRITY = 'Integrity',
  AVAILABILITY = 'Availability',
  AUTHENTICITY = 'Authenticity',
  CORRECTNESS = 'Correctness',
  FRESHNESS = 'Freshness',
  AUTHORIZATION = 'Authorization',
  NON_REPUDIATION = 'Non-repudiation',
}

export enum Impact {
  SEVERE = 'Severe', // REQ-IMP-003: Impact ratings used to categorize damage scenarios
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
  HIGH = 'High', // REQ-DATA-401: Represents high attack feasibility
  MEDIUM = 'Medium',
  LOW = 'Low',
  VERY_LOW = 'Very Low', // REQ-DATA-401: Represents very low attack feasibility
}

export enum RiskLevel {
  NEGLIGIBLE = 'Negligible', // REQ-RSK-001 & REQ-RSK-002: Risk levels determined from impact and attack feasibility
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
  // Note: REQ-DATA-602 states assumptions are linked from security claims
  // This relationship is maintained via SecurityClaim.assumptionIds
}

export interface ToeConfiguration {
  active: boolean;
  id: string;
  name: string;
  description: string;
  comment: string;
  // Note: REQ-DATA-100 specifies this represents an item (vehicle) including variant, version, or relevant information
}

export interface SecurityControl {
  activeRRA: boolean;
  id: string;
  name: string;
  description: string;
  securityGoalIds: string[]; // REQ-DATA-603: Each security goal should link to exactly one control (but a control can support multiple goals)
  comment: string;
  circumventTreeRootIds?: string[]; // REQ-DATA-604: Security controls can have 0..* circumvent trees
  // Note: Security controls are linked from risk treatment decisions via ThreatScenario.securityGoalIds
}

export interface Asset {
  id: string;
  name: string;
  securityProperties: SecurityProperty[]; // REQ-DATA-201: Each asset combined with security properties forms security objectives
  description: string;
  toeConfigurationIds: string[];
  comment: string;
  source?: 'manual' | 'emb3d'; // Track where the asset came from
  emb3dPropertyId?: string; // Reference to the MITRE Emb3d device property ID
  misuseCaseIds?: string[]; // REQ-DATA-202: Allow 0..* misuse cases to be associated with an asset
}

export interface DamageScenario {
  id: string;
  name: string;
  description: string;
  impactCategory: string; // REQ-DATA-500 & REQ-IMP-002: Each damage scenario must have exactly one impact category
  impact: Impact; // REQ-DATA-500 & REQ-IMP-003: Each damage scenario must have exactly one impact rating
  reasoning: string; // rst
  comment: string; // rst
}

export interface Threat {
  id: string;
  name: string;
  assetId: string; // REQ-DATA-300: Each threat linked to exactly one security objective (asset)
  securityProperty: SecurityProperty; // REQ-DATA-300: Each threat linked to exactly one security objective (property)
  damageScenarioIds: string[]; // Related damage scenarios
  scales: boolean;
  reasoningScaling: string; // rst
  comment: string; // rst
  misuseCaseIds?: string[]; // Optional misuse cases related to this threat
  initialAFR: AttackFeasibilityRating | 'TBD'; // REQ-DATA-400: Initial attack feasibility rating (computed from attack tree)
  residualAFR: AttackFeasibilityRating | 'TBD'; // REQ-DATA-401: Residual attack feasibility rating (computed from residual attack tree)
  source?: 'manual' | 'emb3d' | 'ai-generated'; // Track the origin of the threat
  emb3dThreatId?: string; // Reference to MITRE Emb3d Threat ID (e.g., TID-101)
}

export enum RiskTreatmentDecision {
  REDUCE = 'Reduce', // REQ-DATA-600 & REQ-RSK-003: Reduce risk, must link to security goals
  ACCEPT = 'Accept', // REQ-DATA-600 & REQ-OPT-002: Accept/Retain risk, should link to security claims
  TRANSFER = 'Transfer', // REQ-DATA-600 & REQ-RSK-004: Transfer/Share risk, must link to security claims
  AVOID = 'Avoid',
  TBD = 'TBD',
}

export interface ThreatScenario {
  id: string;
  name: string;
  description: string; // rst
  threatId: string; // REQ-DATA-301: Each threat scenario linked to exactly one threat
  damageScenarioIds: string[]; // REQ-DATA-302: Each threat scenario linked to 1+ damage scenarios
  attackPotential: AttackPotentialTuple; // REQ-ATT-005: Attack feasibility rating determined from attack potential
  comment: string; // rst
  treatmentDecision?: RiskTreatmentDecision; // REQ-RSK-002: Risk treatment decision for every risk
  securityGoalIds?: string[]; // REQ-RSK-003 & REQ-DATA-602: Required if treatment is REDUCE
  securityClaimIds?: string[]; // REQ-RSK-004 & REQ-DATA-601: Required if treatment is TRANSFER, optional if ACCEPT
}

export interface MisuseCase {
  id: string;
  name: string;
  description: string;
  comment: string;
  assetIds?: string[]; // REQ-OPT-001: Optional, can be associated with assets
}

export interface SecurityGoal {
  id: string;
  name: string;
  responsible: string;
  requirementsLink: string;
  comment: string; // rst
  // Note: REQ-DATA-603 states each security goal should be linked to exactly one security control
  // This relationship is maintained via SecurityControl.securityGoalIds
}

export interface SecurityClaim {
  id: string;
  name: string;
  responsible: string;
  assumptionIds: string[]; // Security claims can reference assumptions
  comment: string; // rst
  // Note: REQ-DATA-601 states claims are linked from risk treatment decisions
  // This relationship is maintained via ThreatScenario.securityClaimIds
}

export interface RelatedDocument {
  id: string;
  authors: string[];
  title: string;
  version: string;
  url: string;
  comment?: string;
}

export interface ImpactCategorySettings {
  categories: string[];
  justification?: string;
}

export enum TaraMethodology {
  ATTACK_FEASIBILITY = 'Attack Feasibility Rating',
  STRIDE = 'STRIDE',
  LIKELIHOOD = 'Likelihood',
  MORA = 'MoRA',
}

export interface Project {
  id: string;
  name: string;
  organizationId: string;
  methodology: TaraMethodology; // New field for TARA methodology
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
  relatedDocuments?: RelatedDocument[];
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
  active: boolean; // Whether the user is active or deactivated
}

export enum OrganizationRole {
  ORG_ADMIN = 'Organization Admin',
  DESIGNER = 'Designer',
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
  'MITRE ATT&CK Database',
  'Circumvent Trees',
  'Attack Leaves',
  '---',
  'Security Claims',
  'Security Goals',
  'Risk Treatment',
  '---',
  'TARA Validation',
  'Project Users',
  'Traceability Graph',
  'Management Summary',
  'Glossary',
  'Related Documents',
] as const;

export type ProjectViewType = typeof projectViews[number];