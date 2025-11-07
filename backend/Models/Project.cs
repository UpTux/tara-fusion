namespace TaraFusion.Models;

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }
    public ICollection<ProjectMembership> ProjectMemberships { get; set; } = new List<ProjectMembership>();
}
