import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { InitializationView } from "./components/InitializationView";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ProjectView } from "./components/ProjectView";
import { Sidebar } from "./components/Sidebar";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { UserManagementView } from "./components/UserManagementView";
import { ConfirmationModal } from "./components/modals/ConfirmationModal";
import { CreateProjectModal } from "./components/modals/CreateProjectModal";
import { ErrorModal } from "./components/modals/ErrorModal";
import { demoProjectPhoenix } from "./data/demoProject";
import {
  Permissions,
  calculatePermissions,
} from "./services/permissionService";
import { recalculateProject } from "./services/projectCalculationService";
import { parseProjectJson } from "./services/projectImportExportService";
import {
  ImpactCategorySettings,
  Organization,
  OrganizationRole,
  Project,
  ProjectMembership,
  ProjectStatus,
  TaraMethodology,
  User,
} from "./types";
import { UserAuth } from "./components/auth/AuthContext";
import { useNavigate } from "react-router-dom";

const defaultImpactCategories: ImpactCategorySettings = {
  categories: [
    "safety impact on the road user",
    "financial impact on the road user",
    "operational impact on the road user",
    "privacy impact on the road user",
    "financial impact on manufacturer(s), e.g. OEM, TIER1",
    "legal impact on manufacturer(s), e.g. OEM, TIER1",
  ],
};

const initialOrganizations: Organization[] = [
  {
    id: "org_1",
    name: "CyberSystems Inc.",
    impactCategorySettings: defaultImpactCategories,
  },
];

// No projects by default - users can create empty projects or import demo data
const initialProjects: Project[] = [];

const initialUsers: User[] = [
  {
    id: "user_1",
    name: "Alice Johnson (Org Admin)",
    email: "alice@cybersystems.com",
    organizationId: "org_1",
    role: OrganizationRole.ORG_ADMIN,
    active: true,
  },
  {
    id: "user_2",
    name: "Bob Williams (Designer)",
    email: "bob@cybersystems.com",
    organizationId: "org_1",
    role: OrganizationRole.DESIGNER,
    active: true,
  },
  {
    id: "user_3",
    name: "Charlie Brown (Viewer)",
    email: "charlie@cybersystems.com",
    organizationId: "org_1",
    role: OrganizationRole.MEMBER,
    active: true,
  },
];

// No project memberships by default since there are no projects
const initialProjectMemberships: ProjectMembership[] = [];

export default function App() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [projectMemberships, setProjectMemberships] = useState<
    ProjectMembership[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [activeMainView, setActiveMainView] = useState<"projects" | "users">(
    "projects"
  );
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [createProjectOrgId, setCreateProjectOrgId] = useState<string | null>(
    null
  );

  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] =
    useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(
    null
  );

  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;
  const activeOrganization =
    organizations.find((o) => o.id === activeProject?.organizationId) || null;
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const permissions: Permissions = useMemo(
    () =>
      calculatePermissions(
        currentUserId,
        activeProject,
        users,
        projectMemberships
      ),
    [currentUserId, activeProject, users, projectMemberships]
  );

  const handleLoadDemoData = useCallback(() => {
    setOrganizations(initialOrganizations);
    setUsers(initialUsers);
    setProjects(initialProjects);
    setProjectMemberships(initialProjectMemberships);
    setCurrentUserId(initialUsers[0]?.id || "");
  }, []);

  const handleCreateFresh = useCallback((username: string, orgName: string) => {
    const newOrg: Organization = {
      id: "org_1",
      name: orgName,
      impactCategorySettings: defaultImpactCategories,
    };

    const newUser: User = {
      id: "user_1",
      name: username,
      email: "",
      organizationId: newOrg.id,
      role: OrganizationRole.ORG_ADMIN,
      active: true,
    };

    setOrganizations([newOrg]);
    setUsers([newUser]);
    setCurrentUserId(newUser.id);
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  }, []);

  const handleAddProject = useCallback((organizationId: string) => {
    setCreateProjectOrgId(organizationId);
    setIsCreateProjectModalOpen(true);
  }, []);

  const handleCreateProject = useCallback(
    (name: string, methodology: TaraMethodology) => {
      if (!createProjectOrgId) return;

      const existingProjectIds = new Set(projects.map((p) => p.id));
      let i = projects.length + 1;
      let newProjectId: string;
      do {
        newProjectId = `proj_${i}`;
        i++;
      } while (existingProjectIds.has(newProjectId));

      const newProject: Project = {
        id: newProjectId,
        name: name,
        organizationId: createProjectOrgId,
        methodology: methodology,
        needs: [],
        projectStatus: ProjectStatus.IN_PROGRESS,
        history: [`${new Date().toLocaleString()}: Project created.`],
      };

      setProjects((prevProjects) => [...prevProjects, newProject]);
      setActiveProjectId(newProject.id);
      setActiveMainView("projects");
      setIsCreateProjectModalOpen(false);
      setCreateProjectOrgId(null);
    },
    [projects, createProjectOrgId]
  );

  const handleAddDemoProject = useCallback(
    (organizationId: string) => {
      const existingProjectIds = new Set(projects.map((p) => p.id));
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
        methodology: TaraMethodology.ATTACK_FEASIBILITY,
        history: [
          `${new Date().toLocaleString()}: Project Phoenix imported as demo data.`,
          ...(demoProjectPhoenix.history || []),
        ],
      } as Project;

      // Recalculate computed values
      newProject = recalculateProject(newProject);

      setProjects((prevProjects) => [...prevProjects, newProject]);
      setActiveProjectId(newProject.id);
      setActiveMainView("projects");
    },
    [projects]
  );

  const handleCreateProjectFromFile = useCallback(
    (jsonString: string, organizationId: string) => {
      try {
        const importedProjectData = parseProjectJson(jsonString);

        const existingProjectIds = new Set(projects.map((p) => p.id));
        let i = projects.length + 1;
        let newProjectId: string;
        do {
          newProjectId = `proj_${i}`;
          i++;
        } while (existingProjectIds.has(newProjectId));

        let newProject: Project = {
          ...(importedProjectData as Project),
          id: newProjectId,
          name: `${importedProjectData.name || "Untitled Project"} (Copy)`,
          organizationId: organizationId,
          methodology:
            importedProjectData.methodology ||
            TaraMethodology.ATTACK_FEASIBILITY,
          history: [
            `${new Date().toLocaleString()}: Project created from file.`,
            ...(importedProjectData.history || []),
          ],
        };

        // Recalculate computed values
        newProject = recalculateProject(newProject);

        setProjects((prevProjects) => [...prevProjects, newProject]);
        setActiveProjectId(newProject.id);
        setActiveMainView("projects");
      } catch (error) {
        console.error("Failed to create project from file:", error);
        setErrorModal({
          isOpen: true,
          message: `Failed to create project from file. ${
            error instanceof Error ? error.message : "Please check file format."
          }`,
        });
      }
    },
    [projects]
  );

  const handleImportProject = useCallback(
    (jsonString: string) => {
      const activeOrgId = activeOrganization?.id;
      if (!activeOrgId) {
        setErrorModal({
          isOpen: true,
          message:
            "Please select a project within an organization first to import a project into it.",
        });
        return;
      }
      handleCreateProjectFromFile(jsonString, activeOrgId);
    },
    [activeOrganization, handleCreateProjectFromFile]
  );

  const handleDeleteProjectRequest = useCallback((projectId: string) => {
    setProjectToDeleteId(projectId);
    setIsDeleteProjectModalOpen(true);
  }, []);

  const handleConfirmDeleteProject = useCallback(() => {
    if (!projectToDeleteId) return;

    setProjects((prev) => prev.filter((p) => p.id !== projectToDeleteId));
    setProjectMemberships((prev) =>
      prev.filter((pm) => pm.projectId !== projectToDeleteId)
    );

    if (activeProjectId === projectToDeleteId) {
      setActiveProjectId(null);
    }

    setIsDeleteProjectModalOpen(false);
    setProjectToDeleteId(null);
  }, [projectToDeleteId, activeProjectId]);

  // User Management Functions
  const handleAddUser = useCallback(
    (user: Omit<User, "id">) => {
      const existingUserIds = new Set(users.map((u) => u.id));
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

      setUsers((prev) => [...prev, newUser]);
    },
    [users]
  );

  const handleUpdateUser = useCallback(
    (userId: string, updates: Partial<User>) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
      );
    },
    []
  );

  const handleDeleteUserRequest = useCallback(
    (userId: string) => {
      const userToDelete = users.find((u) => u.id === userId);
      if (!userToDelete) return;

      if (userId === currentUserId) {
        setErrorModal({ isOpen: true, message: "You cannot delete yourself!" });
        return;
      }

      setUserToDeleteId(userId);
      setIsDeleteUserModalOpen(true);
    },
    [users, currentUserId]
  );

  const handleConfirmDeleteUser = useCallback(() => {
    if (!userToDeleteId) return;

    setUsers((prev) => prev.filter((u) => u.id !== userToDeleteId));
    setProjectMemberships((prev) =>
      prev.filter((pm) => pm.userId !== userToDeleteId)
    );

    setIsDeleteUserModalOpen(false);
    setUserToDeleteId(null);
  }, [userToDeleteId]);

  const handleToggleUserActive = useCallback(
    (userId: string) => {
      if (userId === currentUserId) {
        setErrorModal({
          isOpen: true,
          message: "You cannot deactivate yourself!",
        });
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
      );
    },
    [currentUserId]
  );

  const { t } = useTranslation();
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const mainViewTitle = useMemo(() => {
    if (activeMainView === "users") return t("userManagement");
    if (activeProject) return activeProject.name;
    return t("noProjectSelected");
  }, [activeMainView, activeProject]);

  if (users.length === 0) {
    return (
      <InitializationView
        onLoadDemoData={handleLoadDemoData}
        onCreateFresh={handleCreateFresh}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-vscode-bg-main text-vscode-text-primary font-sans">
      <Sidebar
        organizations={organizations}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setActiveMainView("projects");
        }}
        onAddProject={handleAddProject}
        onAddDemoProject={handleAddDemoProject}
        onCreateProjectFromFile={handleCreateProjectFromFile}
        onDeleteProject={handleDeleteProjectRequest}
        users={users}
        currentUser={currentUser}
        onSelectUser={setCurrentUserId}
        activeView={activeMainView}
        onSelectView={setActiveMainView}
        projectMemberships={projectMemberships}
      />
      <main className="flex-1 flex flex-col bg-vscode-bg-panel">
        <header className="flex items-center justify-between p-4 border-b border-vscode-border bg-vscode-bg-sidebar flex-shrink-0">
          <h1 className="text-2xl font-bold text-vscode-text-bright">
            {mainViewTitle}
          </h1>
          <div className="flex items-center space-x-2 text-sm">
            {/*<span className="font-semibold text-indigo-300">{currentUser.name}</span>*/}
            <ThemeSwitcher />
            <LanguageSwitcher />
            {
              /*isAuthenticated */ session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-vscode-text-secondary">
                    {t("viewingAs")}
                  </span>
                  <div className="">
                    <span className="font-semibold">
                      {session?.user?.email}
                    </span>
                  </div>
                  <button
                    className="px-4 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="action-card">
                  {/*<LoginButton />*/}{" "}
                  <button
                    className="px-4 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50"
                    onClick={() => navigate("/signin")}
                  >
                    Sign In
                  </button>
                </div>
              )
            }
            {/* {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-vscode-text-secondary">
                  {t("viewingAs")}
                </span>
                <div className="">
                  <Profile />
                </div>
                <LogoutButton />
              </div>
            ) : (
              <div className="action-card">
                <LoginButton />
              </div>
            )} */}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {activeMainView === "projects" &&
          activeProject &&
          activeOrganization ? (
            <ProjectView
              key={activeProject.id}
              project={activeProject}
              organization={activeOrganization}
              onUpdateProject={updateProject}
              permissions={permissions}
              onImportProject={handleImportProject}
            />
          ) : activeMainView === "users" ? (
            <UserManagementView
              users={users}
              organizations={organizations}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUserRequest}
              onToggleUserActive={handleToggleUserActive}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-vscode-text-secondary h-full">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-12 w-12 text-vscode-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-vscode-text-primary">
                  {t("noProjectSelected")}
                </h3>
                <p className="mt-1 text-sm text-vscode-text-secondary">
                  {t("pleaseSelectProject")}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />
      <ConfirmationModal
        isOpen={isDeleteProjectModalOpen}
        title={t("deleteProject") || "Delete Project"}
        message={
          projects.find((p) => p.id === projectToDeleteId)
            ? `Are you sure you want to permanently delete the project "${
                projects.find((p) => p.id === projectToDeleteId)?.name
              }"? This action cannot be undone.`
            : "Are you sure you want to delete this project?"
        }
        confirmLabel={t("delete") || "Delete"}
        isDangerous={true}
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => setIsDeleteProjectModalOpen(false)}
      />
      <ConfirmationModal
        isOpen={isDeleteUserModalOpen}
        title={t("deleteUser") || "Delete User"}
        message={
          users.find((u) => u.id === userToDeleteId)
            ? `Are you sure you want to permanently delete user "${
                users.find((u) => u.id === userToDeleteId)?.name
              }"? This will also remove their project memberships.`
            : "Are you sure you want to delete this user?"
        }
        confirmLabel={t("delete") || "Delete"}
        isDangerous={true}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setIsDeleteUserModalOpen(false)}
      />
      {errorModal.isOpen && (
        <ErrorModal
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        />
      )}
    </div>
  );
}
