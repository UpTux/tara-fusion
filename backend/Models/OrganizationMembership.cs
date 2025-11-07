namespace TaraFusion.Models;

public class OrganizationMembership
{
    public Guid UserId { get; set; }
    public User User { get; set; }
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; }
    public string Role { get; set; }
}
