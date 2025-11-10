using Microsoft.EntityFrameworkCore;
using TaraFusion.Models;

namespace TaraFusion.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<OrganizationMembership> OrganizationMemberships { get; set; }
    public DbSet<ProjectMembership> ProjectMemberships { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrganizationMembership>()
            .HasKey(om => new { om.UserId, om.OrganizationId });

        modelBuilder.Entity<ProjectMembership>()
            .HasKey(pm => new { pm.UserId, pm.ProjectId });
    }
}
