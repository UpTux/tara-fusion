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
public class OrganizationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrganizationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrganizations()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var organizations = await _context.OrganizationMemberships
            .Where(om => om.UserId == userId)
            .Select(om => om.Organization)
            .ToListAsync();

        return Ok(organizations);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrganization(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == id && o.OrganizationMemberships.Any(om => om.UserId == userId));

        if (organization == null)
        {
            return NotFound();
        }

        return Ok(organization);
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrganization(Organization organization)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        organization.UserId = userId;

        _context.Organizations.Add(organization);

        var membership = new OrganizationMembership
        {
            UserId = userId,
            OrganizationId = organization.Id,
            Role = "ORG_ADMIN"
        };
        _context.OrganizationMemberships.Add(membership);

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrganization), new { id = organization.Id }, organization);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOrganization(Guid id, Organization organization)
    {
        if (id != organization.Id)
        {
            return BadRequest();
        }

        _context.Entry(organization).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrganization(Guid id)
    {
        var organization = await _context.Organizations.FindAsync(id);
        if (organization == null)
        {
            return NotFound();
        }

        _context.Organizations.Remove(organization);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] OrganizationMembership membership)
    {
        membership.OrganizationId = id;
        _context.OrganizationMemberships.Add(membership);
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var membership = await _context.OrganizationMemberships
            .FirstOrDefaultAsync(om => om.OrganizationId == id && om.UserId == userId);

        if (membership == null)
        {
            return NotFound();
        }

        _context.OrganizationMemberships.Remove(membership);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
