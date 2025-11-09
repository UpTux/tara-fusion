


import { LoginButton } from "@/components/Auth/LoginButton.tsx";
import { LogoutButton } from "@/components/Auth/LogoutButton.tsx";
import { Profile } from "@/components/Auth/Profile.tsx";
import { useAuthenticatedUser } from "@/services/useAuthenticatedUser.ts";
import { useCallback, useMemo, useState } from 'react';
import { ProjectView } from './components/ProjectView';
import { Sidebar } from './components/Sidebar';
import { UserManagementView } from './components/UserManagementView';
import { calculatePermissions, Permissions } from './services/permissionService';
import { recalculateProject } from './services/projectCalculationService';
import { parseProjectJson } from './services/projectImportExportService';
import { AttackFeasibilityRating, Impact, ImpactCategorySettings, NeedStatus, NeedType, Organization, OrganizationRole, Project, ProjectMembership, ProjectRole, ProjectStatus, RiskTreatmentDecision, SecurityProperty, User } from './types';

const defaultImpactCategories: ImpactCategorySettings = {
  categories: [
    'safety impact on the road user',
    'financial impact on the road user',
    'operational impact on the road user',
    'privacy impact on the road user',
    'financial impact on manufacturer(s), e.g. OEM, TIER1',
    'legal impact on manufacturer(s), e.g. OEM, TIER1'
  ]
};

const initialOrganizations: Organization[] = [
  { id: 'org_1', name: 'CyberSystems Inc.', impactCategorySettings: defaultImpactCategories },
];

const initialProjects: Project[] = [
  {
    id: 'proj_1',
    name: 'Project Phoenix',
    organizationId: 'org_1',
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
        comment: 'Assumption is that the internal corporate network is properly firewalled and monitored.'
      },
      {
        id: 'ASS_002',
        active: false,
        name: 'Third-party APIs are Reliable',
        toeConfigurationIds: ['DEFAULT_CONFIG', 'API_V2'],
        comment: 'We assume that external service APIs (e.g., credit score checks) are available and not malicious.'
      }
    ],
    toeConfigurations: [
      {
        id: 'DEFAULT_CONFIG',
        active: true,
        name: 'Default Production Environment',
        description: 'The standard configuration for the customer-facing production servers.',
        comment: 'This configuration assumes all security patches are up-to-date.'
      },
      {
        id: 'API_V2',
        active: false,
        name: 'API v2 Staging',
        description: 'Staging environment for the upcoming v2 API release.',
        comment: 'This environment is not yet hardened for production.'
      }
    ],
    securityControls: [
      {
        id: 'SC_001',
        active: true,
        activeRRA: false,
        name: 'Enforce Multi-Factor Authentication',
        description: 'MFA should be required for all internal systems and customer-facing logins.',
        securityGoalIds: ['SG_001'],
        comment: 'Implementation uses TOTP as the second factor.'
      },
      {
        id: 'SC_002',
        active: true,
        activeRRA: true,
        name: 'Regular Security Audits',
        description: 'Conduct quarterly penetration testing and code reviews.',
        securityGoalIds: ['SG_002', 'SG_003'],
        comment: 'Audits are performed by a certified third-party vendor.'
      }
    ],
    assets: [
      {
        id: 'ASSET_001',
        name: 'Customer Financial Data',
        securityProperties: [SecurityProperty.CONFIDENTIALITY, SecurityProperty.INTEGRITY, SecurityProperty.AVAILABILITY],
        description: 'Includes customer PII, account numbers, transaction history, and balances.',
        toeConfigurationIds: ['DEFAULT_CONFIG'],
        comment: 'This is the most critical asset in the system.'
      },
      {
        id: 'ASSET_002',
        name: 'Transaction Processing Logic',
        securityProperties: [SecurityProperty.INTEGRITY, SecurityProperty.CORRECTNESS],
        description: 'The backend code and services responsible for executing financial transactions.',
        toeConfigurationIds: ['DEFAULT_CONFIG', 'API_V2'],
        comment: 'Any modification could lead to financial fraud.'
      }
    ],
    damageScenarios: [
      {
        id: 'DS_001',
        name: 'Unauthorized remote vehicle control',
        description: 'An attacker gains the ability to control critical vehicle functions remotely (e.g., braking, acceleration).',
        impactCategory: 'safety impact on the road user',
        impact: Impact.SEVERE,
        reasoning: 'Direct control over vehicle dynamics can lead to accidents, causing severe injury or death. This is the worst-case scenario for vehicle control systems.',
        comment: 'This scenario assumes the attacker has bypassed all ECU protections.'
      },
      {
        id: 'DS_002',
        name: 'Customer data exfiltration',
        description: 'Sensitive customer data, including location history and personal information, is stolen from the vehicle or backend servers.',
        impactCategory: 'privacy impact on the road user',
        impact: Impact.MAJOR,
        reasoning: 'The exposure of sensitive user data constitutes a major breach of privacy, leading to potential blackmail, reputational damage, and loss of customer trust.',
        comment: 'Linked to asset ASSET_001.'
      },
      {
        id: 'DS_003',
        name: 'Financial fraud through transaction manipulation',
        description: 'An attacker or malicious insider alters transaction logic or data to illicitly transfer funds, causing direct financial loss.',
        impactCategory: 'financial impact on manufacturer(s), e.g. OEM, TIER1',
        impact: Impact.MAJOR,
        reasoning: 'Direct manipulation of financial transactions can result in significant monetary losses and regulatory fines.',
        comment: 'Linked to asset ASSET_002.'
      }
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
      }
    ],
    misuseCases: [
      {
        id: 'MC_001',
        name: 'Unauthorized Fund Transfer',
        description: 'A user is able to transfer funds from another user\'s account without authorization by manipulating API requests.',
        comment: 'This covers scenarios like session hijacking, CSRF, or parameter tampering.',
      },
      {
        id: 'MC_002',
        name: 'Denial of Service on Login',
        description: 'An attacker can lock out a legitimate user by repeatedly attempting to log in with incorrect credentials, triggering account lock policies.',
        comment: 'Focus on application-level DoS, not network-level.',
      }
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
      }
    ],
    securityClaims: [
      {
        id: 'SCLM_001',
        name: 'Claim regarding internal network security',
        responsible: 'IT Operations',
        assumptionIds: ['ASS_001'],
        comment: 'The IT Operations team is responsible for maintaining the security of the internal corporate network, as stated in assumption ASS_001.',
      }
    ],
    threatScenarios: [
      {
        id: 'TS_001',
        name: 'Scenario for "Extraction of Customer Financial Data" leading to "Customer data exfiltration"',
        description: 'A remote, unauthenticated attacker uses a common SQL injection vulnerability in the transaction search feature to bypass authentication and directly query the customer database.',
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
        description: 'A malicious insider with legitimate access to the production database directly modifies stored procedures related to transaction processing to siphon small amounts of money into their own account.',
        threatId: 'THR_004',
        damageScenarioIds: ['DS_003'],
        attackPotential: { time: 7, expertise: 3, knowledge: 7, access: 5, equipment: 0 },
        comment: 'This risk is accepted based on the claim that internal network access is controlled.',
        treatmentDecision: RiskTreatmentDecision.ACCEPT,
        securityClaimIds: ['SCLM_001'],
      }
    ],
    needs: [
      // Manually added attack tree roots for the threats
      { id: 'THR_001', type: NeedType.ATTACK, title: 'Extraction of Customer Financial Data', description: "Attack targeting the Confidentiality of asset 'Customer Financial Data'.", status: NeedStatus.OPEN, tags: ['threat', 'attack-root'], links: ['ATT_001'], logic_gate: 'OR', position: { x: 50, y: 50 } },
      { id: 'THR_002', type: NeedType.ATTACK, title: 'Manipulation of Customer Financial Data', description: "Attack targeting the Integrity of asset 'Customer Financial Data'.", status: NeedStatus.OPEN, tags: ['threat', 'attack-root'], links: [], position: { x: 50, y: 250 } },
      { id: 'THR_003', type: NeedType.ATTACK, title: 'Blocking of Customer Financial Data', description: "Attack targeting the Availability of asset 'Customer Financial Data'.", status: NeedStatus.OPEN, tags: ['threat', 'attack-root'], links: [], position: { x: 50, y: 450 } },
      { id: 'THR_004', type: NeedType.ATTACK, title: 'Manipulation of Transaction Processing Logic', description: "Attack targeting the Integrity of asset 'Transaction Processing Logic'.", status: NeedStatus.OPEN, tags: ['threat', 'attack-root'], links: [], position: { x: 50, y: 650 } },
      { id: 'THR_005', type: NeedType.ATTACK, title: 'Invalidation of Transaction Processing Logic', description: "Attack targeting the Correctness of asset 'Transaction Processing Logic'.", status: NeedStatus.OPEN, tags: ['threat', 'attack-root'], links: [], position: { x: 50, y: 850 } },

      // Branching attack tree example
      { id: 'ATT_001', type: NeedType.ATTACK, title: 'Gain Unauthorized Access (OR)', description: 'Attacker gains access to internal network through one of several methods.', status: NeedStatus.OPEN, tags: ['network', 'intermediate'], links: ['ATT_002', 'ATT_003'], logic_gate: 'OR', position: { x: 350, y: 50 } },
      { id: 'ATT_002', type: NeedType.ATTACK, title: 'Phish Credentials', description: 'Attacker obtains employee credentials via a targeted phishing attack.', status: NeedStatus.OPEN, tags: ['phishing', 'leaf'], links: [], position: { x: 650, y: 0 }, attackPotential: { time: 2, expertise: 2, knowledge: 3, access: 1, equipment: 1 } },
      { id: 'ATT_003', type: NeedType.ATTACK, title: 'Exploit Web Vulnerability', description: 'Attacker exploits a known SQL injection vulnerability in the login form.', status: NeedStatus.OPEN, tags: ['exploit', 'leaf'], links: [], position: { x: 650, y: 100 }, attackPotential: { time: 3, expertise: 4, knowledge: 4, access: 2, equipment: 2 } },
    ],
  },
  {
    id: 'proj_2',
    name: 'Triton Vehicle ECU',
    organizationId: 'org_2',
    securityManager: 'Bob Williams',
    projectStatus: ProjectStatus.IN_PROGRESS,
    comment: '',
    toeDescription: 'TOE Description for the Triton Vehicle ECU.',
    scope: 'This project focuses on the main Electronic Control Unit (ECU) of the Triton vehicle. In-vehicle network communication (CAN bus) is the primary focus.',
    history: [`${new Date(Date.now() - 172800000).toLocaleString()}: Project created.`],
    needs: [],
    assumptions: [],
    toeConfigurations: [],
    securityControls: [],
    assets: [],
    damageScenarios: [],
    threats: [],
    impactCategorySettings: {
      categories: ['Safety', 'Financial', 'Operational', 'Privacy'],
      justification: 'For the ECU project, we are using simplified, high-level categories as per the V-Model guidelines for this specific component.'
    }
  },
];

const initialUsers: User[] = [
  { id: 'user_1', name: 'Alice Johnson (Org Admin)', email: 'alice@cybersystems.com', organizationId: 'org_1', role: OrganizationRole.ORG_ADMIN, active: true },
  { id: 'user_2', name: 'Bob Williams (Designer)', email: 'bob@cybersystems.com', organizationId: 'org_1', role: OrganizationRole.DESIGNER, active: true },
  { id: 'user_3', name: 'Charlie Brown (Viewer)', email: 'charlie@cybersystems.com', organizationId: 'org_1', role: OrganizationRole.MEMBER, active: true },
];

const initialProjectMemberships: ProjectMembership[] = [
  { userId: 'user_1', projectId: 'proj_1', role: ProjectRole.PROJECT_ADMIN },
  { userId: 'user_2', projectId: 'proj_1', role: ProjectRole.DESIGNER },
  { userId: 'user_3', projectId: 'proj_1', role: ProjectRole.VIEWER },
];


export default function App() {
  const [organizations] = useState<Organization[]>(initialOrganizations);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>('proj_1');

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [projectMemberships, setProjectMemberships] = useState<ProjectMembership[]>(initialProjectMemberships);
  const [currentUserId, setCurrentUserId] = useState<string>('user_1');

  const [activeMainView, setActiveMainView] = useState<'projects' | 'users'>('projects');

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const activeOrganization = organizations.find(o => o.id === activeProject?.organizationId) || null;
  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  const permissions: Permissions = useMemo(() =>
    calculatePermissions(currentUserId, activeProject, users, projectMemberships),
    [currentUserId, activeProject, users, projectMemberships]
  );

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  }, []);

  const handleAddProject = useCallback((organizationId: string) => {
    const existingProjectIds = new Set(projects.map(p => p.id));
    let i = projects.length + 1;
    let newProjectId: string;
    do {
      newProjectId = `proj_${i}`;
      i++;
    } while (existingProjectIds.has(newProjectId));

    const newProject: Project = {
      id: newProjectId,
      name: `New Project ${newProjectId.split('_')[1]}`,
      organizationId: organizationId,
      needs: [],
      projectStatus: ProjectStatus.IN_PROGRESS,
      history: [`${new Date().toLocaleString()}: Project created.`]
    };

    setProjects(prevProjects => [...prevProjects, newProject]);
    setActiveProjectId(newProject.id);
    setActiveMainView('projects');
  }, [projects]);

  const handleCreateProjectFromFile = useCallback((jsonString: string, organizationId: string) => {
    try {
      const importedProjectData = parseProjectJson(jsonString);

      const existingProjectIds = new Set(projects.map(p => p.id));
      let i = projects.length + 1;
      let newProjectId: string;
      do {
        newProjectId = `proj_${i}`;
        i++;
      } while (existingProjectIds.has(newProjectId));

      let newProject: Project = {
        ...(importedProjectData as Project),
        id: newProjectId,
        name: `${importedProjectData.name || 'Untitled Project'} (Copy)`,
        organizationId: organizationId,
        history: [`${new Date().toLocaleString()}: Project created from file.`, ...(importedProjectData.history || [])],
      };

      // Recalculate computed values
      newProject = recalculateProject(newProject);

      setProjects(prevProjects => [...prevProjects, newProject]);
      setActiveProjectId(newProject.id);
      setActiveMainView('projects');

    } catch (error) {
      console.error('Failed to create project from file:', error);
      alert(`Failed to create project from file. ${error instanceof Error ? error.message : 'Please check file format.'}`);
    }
  }, [projects]);

  const handleImportProject = useCallback((jsonString: string) => {
    const activeOrgId = activeOrganization?.id;
    if (!activeOrgId) {
      alert("Please select a project within an organization first to import a project into it.");
      return;
    }
    handleCreateProjectFromFile(jsonString, activeOrgId);
  }, [activeOrganization, handleCreateProjectFromFile]);

  const handleDeleteProject = useCallback((projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;

    if (window.confirm(`Are you sure you want to permanently delete the project "${projectToDelete.name}"? This action cannot be undone.`)) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setProjectMemberships(prev => prev.filter(pm => pm.projectId !== projectId));

      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }
    }
  }, [projects, activeProjectId]);

  // User Management Functions
  const handleAddUser = useCallback((user: Omit<User, 'id'>) => {
    const existingUserIds = new Set(users.map(u => u.id));
    let i = users.length + 1;
    let newUserId: string;
    do {
      newUserId = `user_${i}`;
      i++;
    } while (existingUserIds.has(newUserId));

    const newUser: User = {
      ...user,
      id: newUserId,
    };

    setUsers(prev => [...prev, newUser]);
  }, [users]);

  const handleUpdateUser = useCallback((userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  }, []);

  const handleDeleteUser = useCallback((userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userId === currentUserId) {
      alert('You cannot delete yourself!');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete user "${userToDelete.name}"? This will also remove their project memberships.`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setProjectMemberships(prev => prev.filter(pm => pm.userId !== userId));
    }
  }, [users, currentUserId]);

  const handleToggleUserActive = useCallback((userId: string) => {
    if (userId === currentUserId) {
      alert('You cannot deactivate yourself!');
      return;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u));
  }, [currentUserId]);

  const mainViewTitle = useMemo(() => {
    if (activeMainView === 'users') return 'User Management';
    if (activeProject) return activeProject.name;
    return 'No Project Selected';
  }, [activeMainView, activeProject]);

  const { user, isAuthenticated, isLoading } = useAuthenticatedUser();

  return (
    <div className="flex h-screen w-screen bg-vscode-bg-main text-vscode-text-primary font-sans">
      <Sidebar
        organizations={organizations}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setActiveMainView('projects');
        }}
        onAddProject={handleAddProject}
        onCreateProjectFromFile={handleCreateProjectFromFile}
        onDeleteProject={handleDeleteProject}
        users={users}
        currentUser={currentUser}
        onSelectUser={setCurrentUserId}
        activeView={activeMainView}
        onSelectView={setActiveMainView}
        projectMemberships={projectMemberships}
      />
      <main className="flex-1 flex flex-col bg-vscode-bg-panel">
        <header className="flex items-center justify-between p-4 border-b border-vscode-border bg-vscode-bg-sidebar flex-shrink-0">
          <h1 className="text-2xl font-bold text-vscode-text-bright">{mainViewTitle}</h1>
          <div className="flex items-center space-x-2 text-sm">
            {/*<span className="font-semibold text-indigo-300">{currentUser.name}</span>*/}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-vscode-text-secondary">Viewing as:</span>
                <div className="">
                  <Profile />
                </div>
                <LogoutButton />
              </div>
            ) : (
              <div className="action-card">
                <LoginButton />
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {activeMainView === 'projects' && activeProject && activeOrganization ? (
            <ProjectView
              key={activeProject.id}
              project={activeProject}
              organization={activeOrganization}
              onUpdateProject={updateProject}
              permissions={permissions}
              onImportProject={handleImportProject}
            />
          ) : activeMainView === 'users' ? (
            <UserManagementView
              users={users}
              organizations={organizations}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onToggleUserActive={handleToggleUserActive}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-vscode-text-secondary h-full">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-vscode-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-vscode-text-primary">No project selected</h3>
                <p className="mt-1 text-sm text-vscode-text-secondary">Please select a project from the sidebar to begin.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
