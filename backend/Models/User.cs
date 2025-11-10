namespace TaraFusion.Models;

public class User
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public Guid OrganizationId { get; set; }
    public Organization? Organization { get; set; }
    public required string Role { get; set; } // Role in the organization: ORG_ADMIN, MEMBER
    public bool Active { get; set; } = true; // Whether the user is active or deactivated
}
