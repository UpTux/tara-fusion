import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { calculatePermissions } from "../services/permissionService";
import { isElectron } from "../utils/platform";
import {
  Organization,
  OrganizationRole,
  Project,
  ProjectMembership,
  User,
} from "../types";
import { CurrentUserSelector } from "./CurrentUserSelector";
import { FolderIcon } from "./icons/FolderIcon";
import { PlusIcon } from "./icons/PlusIcon";
import { TrashIcon } from "./icons/TrashIcon";
import { UploadIcon } from "./icons/UploadIcon";
import { UsersIcon } from "./icons/UsersIcon";
import { ErrorModal } from "./modals/ErrorModal";

interface SidebarProps {
  organizations: Organization[];
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (organizationId: string) => void;
  onAddDemoProject: (organizationId: string) => void;
  onCreateProjectFromFile: (jsonString: string, organizationId: string) => void;
  onDeleteProject: (projectId: string) => void;
  users: User[];
  currentUser: User;
  onSelectUser: (userId: string) => void;
  activeView: "projects" | "users";
  onSelectView: (view: "projects" | "users") => void;
  projectMemberships: ProjectMembership[];
  isDemoDataLoaded: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  organizations,
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onAddDemoProject,
  onCreateProjectFromFile,
  onDeleteProject,
  users,
  currentUser,
  onSelectUser,
  activeView,
  onSelectView,
  projectMemberships,
  isDemoDataLoaded,
}) => {
  const { t } = useTranslation();
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });
  const handleFileImport = (
    event: React.ChangeEvent<HTMLInputElement>,
    organizationId: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        onCreateProjectFromFile(content, organizationId);
      } catch (error) {
        console.error("Failed to read project file:", error);
        setErrorModal({
          isOpen: true,
          message: "Failed to read project file.",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset file input to allow re-uploading the same file
  };

  // Check if user can add projects (Org Admin or Designer)
  const canAddProjects =
    currentUser.role === OrganizationRole.ORG_ADMIN ||
    currentUser.role === OrganizationRole.DESIGNER;

  return (
    <aside className="w-72 bg-vscode-bg-sidebar border-r border-vscode-border flex flex-col">
      <div className="p-4 border-b border-vscode-border">
        <div className="flex items-center space-x-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-vscode-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <h1 className="text-xl font-bold text-vscode-text-bright">
            TARA Fusion
          </h1>
        </div>
      </div>

      <div className="px-4 pb-2 pt-2 border-b border-vscode-border">
        <div className="flex bg-vscode-bg-input rounded-md p-1">
          <button
            onClick={() => onSelectView("projects")}
            className={`${
              currentUser.role === "Organization Admin" ? "w-1/2" : "w-full"
            } py-1.5 text-sm font-semibold rounded-sm transition-colors flex items-center justify-center ${
              activeView === "projects"
                ? "bg-vscode-bg-selected text-vscode-text-bright"
                : "text-vscode-text-secondary hover:bg-vscode-bg-hover hover:text-vscode-text-primary"
            }`}
          >
            <FolderIcon className="w-5 h-5 mr-2" /> {t("projects")}
          </button>
          {currentUser.role === "Organization Admin" && (
            <button
              onClick={() => onSelectView("users")}
              disabled={isElectron() && !isDemoDataLoaded}
              className={`w-1/2 py-1.5 text-sm font-semibold rounded-sm transition-colors flex items-center justify-center ${
                isElectron() && !isDemoDataLoaded
                  ? "opacity-50 cursor-not-allowed text-vscode-text-secondary"
                  : activeView === "users"
                  ? "bg-vscode-bg-selected text-vscode-text-bright"
                  : "text-vscode-text-secondary hover:bg-vscode-bg-hover hover:text-vscode-text-primary"
              }`}
              title={
                isElectron() && !isDemoDataLoaded
                  ? "User management is only available in demo mode on Desktop"
                  : ""
              }
            >
              <UsersIcon className="w-5 h-5 mr-2" /> {t("users")}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeView === "projects" ? (
          <>
            {organizations.map((org) => (
              <div key={org.id} className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xs font-semibold text-vscode-text-secondary uppercase tracking-wider">
                    {org.name}
                  </h2>
                  {canAddProjects && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onAddDemoProject(org.id)}
                        className="text-vscode-text-secondary hover:text-vscode-accent transition-colors text-xs px-2 py-0.5 rounded-sm border border-vscode-border hover:border-vscode-accent"
                        title={`Import "Project Phoenix" demo project to ${org.name}`}
                      >
                        Demo
                      </button>
                      <label
                        className="text-vscode-text-secondary hover:text-vscode-accent transition-colors cursor-pointer"
                        title={`Create project from file in ${org.name}`}
                      >
                        <UploadIcon className="w-4 h-4" />
                        <input
                          type="file"
                          className="hidden"
                          accept=".json"
                          onChange={(e) => handleFileImport(e, org.id)}
                        />
                      </label>
                      <button
                        onClick={() => onAddProject(org.id)}
                        className="text-vscode-text-secondary hover:text-vscode-accent transition-colors"
                        title={`Add empty project to ${org.name}`}
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <ul className="space-y-1">
                  {projects
                    .filter((p) => p.organizationId === org.id)
                    .map((proj) => {
                      const permissions = calculatePermissions(
                        currentUser.id,
                        proj,
                        users,
                        projectMemberships
                      );
                      return (
                        <li
                          key={proj.id}
                          className="group flex items-center justify-between rounded-sm transition-colors hover:bg-vscode-bg-hover"
                        >
                          <button
                            onClick={() => onSelectProject(proj.id)}
                            className={`flex-grow text-left px-3 py-1.5 rounded-sm text-sm font-normal transition-all duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-vscode-accent ${
                              activeProjectId === proj.id
                                ? "bg-vscode-bg-selected text-vscode-text-bright"
                                : "text-vscode-text-primary group-hover:bg-vscode-bg-hover group-hover:text-vscode-text-bright"
                            }`}
                          >
                            {proj.name}
                          </button>
                          {permissions.isProjectAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProject(proj.id);
                              }}
                              className="ml-1 mr-1 p-1.5 rounded-sm text-vscode-text-secondary hover:text-red-400 hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 flex-shrink-0"
                              title={`Delete ${proj.name}`}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </>
        ) : (
          <div className="p-4 text-center text-vscode-text-secondary text-sm">
            {currentUser.role === "Organization Admin" ? (
              <>
                <p>User Management is active.</p>
                <p className="mt-2">
                  Use the main panel to manage users for your organization.
                </p>
              </>
            ) : (
              <p>
                You must be an Organization Admin to access user management.
              </p>
            )}
          </div>
        )}
      </div>

      {isDemoDataLoaded && (
        <CurrentUserSelector
          users={users}
          currentUser={currentUser}
          onSelectUser={onSelectUser}
        />
      )}
      {errorModal.isOpen && (
        <ErrorModal
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        />
      )}
    </aside>
  );
};
