using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaraFusion.Data;
using TaraFusion.Models;
using System.Security.Claims;

namespace TaraFusion.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProjectsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = Guid.Parse(userIdClaim);
        var projects = await _context.ProjectMemberships
            .Where(pm => pm.UserId == userId)
            .Select(pm => pm.Project)
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(Guid id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = Guid.Parse(userIdClaim);
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == id && p.ProjectMemberships.Any(pm => pm.UserId == userId));

        if (project == null)
        {
            return NotFound();
        }

        return Ok(project);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProject(Project project)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return Unauthorized();

        var userId = Guid.Parse(userIdClaim);
        project.UserId = userId;

        _context.Projects.Add(project);

        var membership = new ProjectMembership
        {
            UserId = userId,
            ProjectId = project.Id,
            Role = "PROJECT_ADMIN"
        };
        _context.ProjectMemberships.Add(membership);

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(Guid id, Project project)
    {
        if (id != project.Id)
        {
            return BadRequest();
        }

        _context.Entry(project).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null)
        {
            return NotFound();
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] ProjectMembership membership)
    {
        membership.ProjectId = id;
        _context.ProjectMemberships.Add(membership);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var membership = await _context.ProjectMemberships
            .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId);

        if (membership == null)
        {
            return NotFound();
        }

        _context.ProjectMemberships.Remove(membership);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
