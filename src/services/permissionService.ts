import { OrganizationMembership, OrganizationRole, Project, ProjectMembership, ProjectRole } from '../types';

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

export const getOrganizationMembership = (
  userId: string,
  organizationId: string,
  organizationMemberships: OrganizationMembership[]
): OrganizationMembership | undefined => {
  return organizationMemberships.find(om => om.userId === userId && om.organizationId === organizationId);
};


export const calculatePermissions = (
  userId: string,
  project: Project | null,
  orgMemberships: OrganizationMembership[],
  projMemberships: ProjectMembership[]
): Permissions => {
  if (!project) {
    // Default permissions when no project is selected
    const isAnyOrgAdmin = orgMemberships.some(om => om.userId === userId && om.role === OrganizationRole.ORG_ADMIN);
    return { canEditProject: false, isProjectAdmin: false, isOrgAdmin: isAnyOrgAdmin };
  }

  const orgMembership = getOrganizationMembership(userId, project.organizationId, orgMemberships);
  const projectMembership = getProjectMembership(userId, project.id, projMemberships);

  const isOrgAdmin = orgMembership?.role === OrganizationRole.ORG_ADMIN;
  const isProjectAdmin = projectMembership?.role === ProjectRole.PROJECT_ADMIN;

  const canEdit = isOrgAdmin || isProjectAdmin || projectMembership?.role === ProjectRole.DESIGNER;

  return {
    canEditProject: canEdit,
    isProjectAdmin: isProjectAdmin || isOrgAdmin,
    isOrgAdmin: isOrgAdmin,
  };
};
