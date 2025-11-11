


import { LoginButton } from "@/components/Auth/LoginButton.tsx";
import { LogoutButton } from "@/components/Auth/LogoutButton.tsx";
import { Profile } from "@/components/Auth/Profile.tsx";
import { useAuthenticatedUser } from "@/services/useAuthenticatedUser.ts";
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ProjectView } from './components/ProjectView';
import { Sidebar } from './components/Sidebar';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { UserManagementView } from './components/UserManagementView';
import { demoProjectPhoenix } from './data/demoProject';
import { calculatePermissions, Permissions } from './services/permissionService';
import { recalculateProject } from './services/projectCalculationService';
import { parseProjectJson } from './services/projectImportExportService';
import { ImpactCategorySettings, Organization, OrganizationRole, Project, ProjectMembership, ProjectStatus, User } from './types';

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

// No projects by default - users can create empty projects or import demo data
const initialProjects: Project[] = [];

const initialUsers: User[] = [
  { id: 'user_1', name: 'Alice Johnson (Org Admin)', email: 'alice@cybersystems.com', organizationId: 'org_1', role: OrganizationRole.ORG_ADMIN, active: true },
  { id: 'user_2', name: 'Bob Williams (Designer)', email: 'bob@cybersystems.com', organizationId: 'org_1', role: OrganizationRole.DESIGNER, active: true },
  { id: 'user_3', name: 'Charlie Brown (Viewer)', email: 'charlie@cybersystems.com', organizationId: 'org_1', role: OrganizationRole.MEMBER, active: true },
];

// No project memberships by default since there are no projects
const initialProjectMemberships: ProjectMembership[] = [];


export default function App() {
  const [organizations] = useState<Organization[]>(initialOrganizations);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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

  const handleAddDemoProject = useCallback((organizationId: string) => {
    const existingProjectIds = new Set(projects.map(p => p.id));
    let i = projects.length + 1;
    let newProjectId: string;
    do {
      newProjectId = `proj_${i}`;
      i++;
    } while (existingProjectIds.has(newProjectId));

    let newProject: Project = {
      ...demoProjectPhoenix,
      id: newProjectId,
      organizationId: organizationId,
      history: [`${new Date().toLocaleString()}: Project Phoenix imported as demo data.`, ...(demoProjectPhoenix.history || [])],
    } as Project;

    // Recalculate computed values
    newProject = recalculateProject(newProject);

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

  const { t } = useTranslation();

  const mainViewTitle = useMemo(() => {
    if (activeMainView === 'users') return t('userManagement');
    if (activeProject) return activeProject.name;
    return t('noProjectSelected');
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
        onAddDemoProject={handleAddDemoProject}
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
            <ThemeSwitcher />
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-vscode-text-secondary">{t('viewingAs')}</span>
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
                <h3 className="mt-2 text-sm font-medium text-vscode-text-primary">{t('noProjectSelected')}</h3>
                <p className="mt-1 text-sm text-vscode-text-secondary">{t('pleaseSelectProject')}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
