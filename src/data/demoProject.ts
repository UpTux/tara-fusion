import {
    AttackFeasibilityRating,
    Impact,
    NeedStatus,
    NeedType,
    Project,
    ProjectStatus,
    RiskTreatmentDecision,
    SecurityProperty,
} from '../types';

/**
 * Demo project data: "Project Phoenix"
 * 
 * This is a comprehensive TARA (Threat Analysis & Risk Assessment) example
 * for a banking application. It includes:
 * - TOE description, scope, and assumptions
 * - Assets with security properties
 * - Damage scenarios with impact ratings
 * - Threats targeting assets
 * - Threat scenarios with attack feasibility
 * - Security goals and controls
 * - Attack tree visualization data
 * 
 * Users can import this as demo data to explore the application features.
 */
export const demoProjectPhoenix: Omit<Project, 'id' | 'organizationId'> = {
    name: 'Project Phoenix',
    securityManager: 'Alice Johnson',
    projectStatus: ProjectStatus.IN_PROGRESS,
    comment: 'Initial TARA for the Phoenix banking application. Focus on external threats.',
    history: [`${new Date(Date.now() - 86400000).toLocaleString()}: Project created.`],
    toeDescription: `.. role:: bold-red
   :class: font-bold text-red-400

This is the **TOE Description** for Project Phoenix.

It is a customer-facing web application for online banking, built with:
- React frontend
- Java backend
- PostgreSQL database

The system handles :bold-red:\`sensitive financial data\`.
`,
    scope: `This project covers the security analysis of the customer-facing web application.

Out of scope are:
- Internal corporate network infrastructure.
- Physical security of the data centers.
`,
    assumptions: [
        {
            id: 'ASS_001',
            active: true,
            name: 'Internal Network is Secure',
            toeConfigurationIds: ['DEFAULT_CONFIG'],
            comment: 'Assumption is that the internal corporate network is properly firewalled and monitored.',
        },
        {
            id: 'ASS_002',
            active: false,
            name: 'Third-party APIs are Reliable',
            toeConfigurationIds: ['DEFAULT_CONFIG', 'API_V2'],
            comment: 'We assume that external service APIs (e.g., credit score checks) are available and not malicious.',
        },
    ],
    toeConfigurations: [
        {
            id: 'DEFAULT_CONFIG',
            active: true,
            name: 'Default Production Environment',
            description: 'The standard configuration for the customer-facing production servers.',
            comment: 'This configuration assumes all security patches are up-to-date.',
        },
        {
            id: 'API_V2',
            active: false,
            name: 'API v2 Staging',
            description: 'Staging environment for the upcoming v2 API release.',
            comment: 'This environment is not yet hardened for production.',
        },
    ],
    securityControls: [
        {
            id: 'SC_001',
            activeRRA: false,
            name: 'Enforce Multi-Factor Authentication',
            description: 'MFA should be required for all internal systems and customer-facing logins.',
            securityGoalIds: ['SG_001'],
            comment: 'Implementation uses TOTP as the second factor.',
        },
        {
            id: 'SC_002',
            activeRRA: true,
            name: 'Regular Security Audits',
            description: 'Conduct quarterly penetration testing and code reviews.',
            securityGoalIds: ['SG_002', 'SG_003'],
            comment: 'Audits are performed by a certified third-party vendor.',
        },
    ],
    assets: [
        {
            id: 'ASSET_001',
            name: 'Customer Financial Data',
            securityProperties: [
                SecurityProperty.CONFIDENTIALITY,
                SecurityProperty.INTEGRITY,
                SecurityProperty.AVAILABILITY,
            ],
            description: 'Includes customer PII, account numbers, transaction history, and balances.',
            toeConfigurationIds: ['DEFAULT_CONFIG'],
            comment: 'This is the most critical asset in the system.',
        },
        {
            id: 'ASSET_002',
            name: 'Transaction Processing Logic',
            securityProperties: [SecurityProperty.INTEGRITY, SecurityProperty.CORRECTNESS],
            description: 'The backend code and services responsible for executing financial transactions.',
            toeConfigurationIds: ['DEFAULT_CONFIG', 'API_V2'],
            comment: 'Any modification could lead to financial fraud.',
        },
    ],
    damageScenarios: [
        {
            id: 'DS_001',
            name: 'Unauthorized remote vehicle control',
            description:
                'An attacker gains the ability to control critical vehicle functions remotely (e.g., braking, acceleration).',
            impactCategory: 'safety impact on the road user',
            impact: Impact.SEVERE,
            reasoning:
                'Direct control over vehicle dynamics can lead to accidents, causing severe injury or death. This is the worst-case scenario for vehicle control systems.',
            comment: 'This scenario assumes the attacker has bypassed all ECU protections.',
        },
        {
            id: 'DS_002',
            name: 'Customer data exfiltration',
            description:
                'Sensitive customer data, including location history and personal information, is stolen from the vehicle or backend servers.',
            impactCategory: 'privacy impact on the road user',
            impact: Impact.MAJOR,
            reasoning:
                'The exposure of sensitive user data constitutes a major breach of privacy, leading to potential blackmail, reputational damage, and loss of customer trust.',
            comment: 'Linked to asset ASSET_001.',
        },
        {
            id: 'DS_003',
            name: 'Financial fraud through transaction manipulation',
            description:
                'An attacker or malicious insider alters transaction logic or data to illicitly transfer funds, causing direct financial loss.',
            impactCategory: 'financial impact on manufacturer(s), e.g. OEM, TIER1',
            impact: Impact.MAJOR,
            reasoning:
                'Direct manipulation of financial transactions can result in significant monetary losses and regulatory fines.',
            comment: 'Linked to asset ASSET_002.',
        },
    ],
    threats: [
        {
            id: 'THR_001',
            name: 'Extraction of Customer Financial Data',
            assetId: 'ASSET_001',
            securityProperty: SecurityProperty.CONFIDENTIALITY,
            damageScenarioIds: ['DS_002'],
            scales: true,
            reasoningScaling: 'The more customer records are exfiltrated, the higher the financial and reputational damage.',
            comment: 'Primary threat targeting data at rest and in transit.',
            misuseCaseIds: [],
            initialAFR: AttackFeasibilityRating.HIGH,
            residualAFR: AttackFeasibilityRating.MEDIUM,
        },
        {
            id: 'THR_002',
            name: 'Manipulation of Customer Financial Data',
            assetId: 'ASSET_001',
            securityProperty: SecurityProperty.INTEGRITY,
            damageScenarioIds: [],
            scales: false,
            reasoningScaling: '',
            comment: '',
            misuseCaseIds: [],
            initialAFR: AttackFeasibilityRating.HIGH,
            residualAFR: AttackFeasibilityRating.LOW,
        },
        {
            id: 'THR_003',
            name: 'Blocking of Customer Financial Data',
            assetId: 'ASSET_001',
            securityProperty: SecurityProperty.AVAILABILITY,
            damageScenarioIds: [],
            scales: true,
            reasoningScaling: 'Service outage duration directly impacts operational costs and customer trust.',
            comment: 'Could be achieved via DDoS or ransomware.',
            misuseCaseIds: ['MC_002'],
            initialAFR: AttackFeasibilityRating.MEDIUM,
            residualAFR: AttackFeasibilityRating.LOW,
        },
        {
            id: 'THR_004',
            name: 'Manipulation of Transaction Processing Logic',
            assetId: 'ASSET_002',
            securityProperty: SecurityProperty.INTEGRITY,
            damageScenarioIds: ['DS_003'],
            scales: false,
            reasoningScaling: '',
            comment: 'A critical threat that could lead to widespread fraud.',
            misuseCaseIds: ['MC_001'],
            initialAFR: AttackFeasibilityRating.HIGH,
            residualAFR: AttackFeasibilityRating.MEDIUM,
        },
        {
            id: 'THR_005',
            name: 'Invalidation of Transaction Processing Logic',
            assetId: 'ASSET_002',
            securityProperty: SecurityProperty.CORRECTNESS,
            damageScenarioIds: [],
            scales: false,
            reasoningScaling: '',
            comment: 'e.g., introducing rounding errors or incorrect calculations.',
            misuseCaseIds: [],
            initialAFR: AttackFeasibilityRating.HIGH,
            residualAFR: AttackFeasibilityRating.LOW,
        },
    ],
    misuseCases: [
        {
            id: 'MC_001',
            name: 'Unauthorized Fund Transfer',
            description:
                "A user is able to transfer funds from another user's account without authorization by manipulating API requests.",
            comment: 'This covers scenarios like session hijacking, CSRF, or parameter tampering.',
        },
        {
            id: 'MC_002',
            name: 'Denial of Service on Login',
            description:
                'An attacker can lock out a legitimate user by repeatedly attempting to log in with incorrect credentials, triggering account lock policies.',
            comment: 'Focus on application-level DoS, not network-level.',
        },
    ],
    securityGoals: [
        {
            id: 'SG_001',
            name: 'Ensure User Authentication',
            responsible: 'Development Team',
            requirementsLink: 'https://jira.example.com/REQ-123',
            comment: 'All access to customer data must be authenticated.',
        },
        {
            id: 'SG_002',
            name: 'Regular System Auditing',
            responsible: 'Security Team',
            requirementsLink: 'https://jira.example.com/REQ-124',
            comment: 'System logs and access patterns must be audited quarterly.',
        },
        {
            id: 'SG_003',
            name: 'Secure Coding Practices',
            responsible: 'Development Team',
            requirementsLink: 'https://internal.wiki/secure-coding',
            comment: 'Follow established secure coding guidelines to prevent common vulnerabilities like SQLi.',
        },
    ],
    securityClaims: [
        {
            id: 'SCLM_001',
            name: 'Claim regarding internal network security',
            responsible: 'IT Operations',
            assumptionIds: ['ASS_001'],
            comment:
                'The IT Operations team is responsible for maintaining the security of the internal corporate network, as stated in assumption ASS_001.',
        },
    ],
    threatScenarios: [
        {
            id: 'TS_001',
            name: 'Scenario for "Extraction of Customer Financial Data" leading to "Customer data exfiltration"',
            description:
                'A remote, unauthenticated attacker uses a common SQL injection vulnerability in the transaction search feature to bypass authentication and directly query the customer database.',
            threatId: 'THR_001',
            damageScenarioIds: ['DS_002'],
            attackPotential: { time: 4, expertise: 6, knowledge: 3, access: 0, equipment: 0 },
            comment: 'This risk will be mitigated by implementing prepared statements.',
            treatmentDecision: RiskTreatmentDecision.REDUCE,
            securityGoalIds: ['SG_003'],
        },
        {
            id: 'TS_002',
            name: 'Scenario for "Manipulation of Transaction Processing Logic" leading to "Financial fraud through transaction manipulation"',
            description:
                'A malicious insider with legitimate access to the production database directly modifies stored procedures related to transaction processing to siphon small amounts of money into their own account.',
            threatId: 'THR_004',
            damageScenarioIds: ['DS_003'],
            attackPotential: { time: 7, expertise: 3, knowledge: 7, access: 5, equipment: 0 },
            comment: 'This risk is accepted based on the claim that internal network access is controlled.',
            treatmentDecision: RiskTreatmentDecision.ACCEPT,
            securityClaimIds: ['SCLM_001'],
        },
    ],
    needs: [
        // Manually added attack tree roots for the threats
        {
            id: 'THR_001',
            type: NeedType.ATTACK,
            title: 'Extraction of Customer Financial Data',
            description: "Attack targeting the Confidentiality of asset 'Customer Financial Data'.",
            status: NeedStatus.OPEN,
            tags: ['threat', 'attack-root'],
            links: ['ATT_001'],
            logic_gate: 'AND',
            position: { x: 50, y: 50 },
        },
        {
            id: 'THR_002',
            type: NeedType.ATTACK,
            title: 'Manipulation of Customer Financial Data',
            description: "Attack targeting the Integrity of asset 'Customer Financial Data'.",
            status: NeedStatus.OPEN,
            tags: ['threat', 'attack-root'],
            links: [],
            logic_gate: 'AND',
            position: { x: 50, y: 250 },
        },
        {
            id: 'THR_003',
            type: NeedType.ATTACK,
            title: 'Blocking of Customer Financial Data',
            description: "Attack targeting the Availability of asset 'Customer Financial Data'.",
            status: NeedStatus.OPEN,
            tags: ['threat', 'attack-root'],
            links: [],
            logic_gate: 'AND',
            position: { x: 50, y: 450 },
        },
        {
            id: 'THR_004',
            type: NeedType.ATTACK,
            title: 'Manipulation of Transaction Processing Logic',
            description: "Attack targeting the Integrity of asset 'Transaction Processing Logic'.",
            status: NeedStatus.OPEN,
            tags: ['threat', 'attack-root'],
            links: [],
            logic_gate: 'AND',
            position: { x: 50, y: 650 },
        },
        {
            id: 'THR_005',
            type: NeedType.ATTACK,
            title: 'Invalidation of Transaction Processing Logic',
            description: "Attack targeting the Correctness of asset 'Transaction Processing Logic'.",
            status: NeedStatus.OPEN,
            tags: ['threat', 'attack-root'],
            links: [],
            logic_gate: 'AND',
            position: { x: 50, y: 850 },
        },

        // Branching attack tree example
        {
            id: 'ATT_001',
            type: NeedType.ATTACK,
            title: 'Gain Unauthorized Access (OR)',
            description: 'Attacker gains access to internal network through one of several methods.',
            status: NeedStatus.OPEN,
            tags: ['network', 'intermediate'],
            links: ['ATT_002', 'ATT_003'],
            logic_gate: 'OR',
            position: { x: 350, y: 50 },
        },
        {
            id: 'ATT_002',
            type: NeedType.ATTACK,
            title: 'Phish Credentials',
            description: 'Attacker obtains employee credentials via a targeted phishing attack.',
            status: NeedStatus.OPEN,
            tags: ['phishing', 'leaf'],
            links: [],
            position: { x: 650, y: 0 },
            attackPotential: { time: 2, expertise: 0, knowledge: 3, access: 0, equipment: 0 },
        },
        {
            id: 'ATT_003',
            type: NeedType.ATTACK,
            title: 'Exploit Web Vulnerability',
            description: 'Attacker exploits a known SQL injection vulnerability in the login form.',
            status: NeedStatus.OPEN,
            tags: ['exploit', 'leaf'],
            links: [],
            position: { x: 650, y: 100 },
            attackPotential: { time: 0, expertise: 0, knowledge: 0, access: 2, equipment: 0 },
        },
    ],
};
