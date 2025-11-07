import { OrganizationRole, Project, ProjectMembership, ProjectRole, User } from '../types';

export interface Permissions {
  canEditProject: boolean;
  isProjectAdmin: boolean;
  isOrgAdmin: boolean;
}

export const getProjectMembership = (
  userId: string,
  projectId: string,
  projectMemberships: ProjectMembership[]
): ProjectMembership | undefined => {
  return projectMemberships.find(pm => pm.userId === userId && pm.projectId === projectId);
};

export const getUserOrganizationRole = (
  userId: string,
  organizationId: string,
  users: User[]
): OrganizationRole | undefined => {
  const user = users.find(u => u.id === userId && u.organizationId === organizationId);
  return user?.role;
};

export const calculatePermissions = (
  userId: string,
  project: Project | null,
  users: User[],
  projMemberships: ProjectMembership[]
): Permissions => {
  if (!project) {
    // Default permissions when no project is selected
    const currentUser = users.find(u => u.id === userId);
    const isAnyOrgAdmin = currentUser?.role === OrganizationRole.ORG_ADMIN;
    return { canEditProject: false, isProjectAdmin: false, isOrgAdmin: isAnyOrgAdmin || false };
  }

  const userRole = getUserOrganizationRole(userId, project.organizationId, users);
  const projectMembership = getProjectMembership(userId, project.id, projMemberships);

  const isOrgAdmin = userRole === OrganizationRole.ORG_ADMIN;
  const isProjectAdmin = projectMembership?.role === ProjectRole.PROJECT_ADMIN;

  const canEdit = isOrgAdmin || isProjectAdmin || projectMembership?.role === ProjectRole.DESIGNER;

  return {
    canEditProject: canEdit,
    isProjectAdmin: isProjectAdmin || isOrgAdmin,
    isOrgAdmin: isOrgAdmin,
  };
};
