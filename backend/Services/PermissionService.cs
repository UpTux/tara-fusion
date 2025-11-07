using TaraFusion.Data;
using TaraFusion.DTOs;
using TaraFusion.Models;
using Microsoft.EntityFrameworkCore;

namespace TaraFusion.Services;

public class PermissionService
{
    private readonly ApplicationDbContext _context;

    public PermissionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProjectMembership?> GetProjectMembership(Guid userId, Guid projectId)
    {
        return await _context.ProjectMemberships
            .FirstOrDefaultAsync(pm => pm.UserId == userId && pm.ProjectId == projectId);
    }

    public async Task<OrganizationMembership?> GetOrganizationMembership(Guid userId, Guid organizationId)
    {
        return await _context.OrganizationMemberships
            .FirstOrDefaultAsync(om => om.UserId == userId && om.OrganizationId == organizationId);
    }

    public async Task<PermissionsDto> CalculatePermissions(Guid userId, Guid projectId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project == null)
        {
            return new PermissionsDto { CanEditProject = false, IsProjectAdmin = false, IsOrgAdmin = false };
        }

        var orgMembership = await GetOrganizationMembership(userId, project.OrganizationId);
        var projectMembership = await GetProjectMembership(userId, projectId);

        var isOrgAdmin = orgMembership?.Role == "ORG_ADMIN";
        var isProjectAdmin = projectMembership?.Role == "PROJECT_ADMIN";

        var canEdit = isOrgAdmin || isProjectAdmin || projectMembership?.Role == "DESIGNER";

        return new PermissionsDto
        {
            CanEditProject = canEdit,
            IsProjectAdmin = isProjectAdmin || isOrgAdmin,
            IsOrgAdmin = isOrgAdmin,
        };
    }
}
