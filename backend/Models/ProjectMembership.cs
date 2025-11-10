namespace TaraFusion.Models;

public class ProjectMembership
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public required string Role { get; set; }
}
