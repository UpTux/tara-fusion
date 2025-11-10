namespace TaraFusion.DTOs;

public class PermissionsDto
{
    public bool CanEditProject { get; set; }
    public bool IsProjectAdmin { get; set; }
    public bool IsOrgAdmin { get; set; }
}
