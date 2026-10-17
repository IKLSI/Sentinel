using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Git;
namespace Sentinel.Domain.Entities;

public class Organization : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool SecurityAlertsEnabled { get; set; } = true;
    public VulnerabilitySeverity AlertMinSeverity { get; set; } = VulnerabilitySeverity.High;
    public string? GithubToken { get; set; }
    public string? GitlabToken { get; set; }
    public string? GitlabBaseUrl { get; set; }

    public int TicketCounter { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();

    public GitLabInstance ToGitLabInstance() =>
        new(GitlabBaseUrl ?? RepositoryHosts.PublicGitLabBaseUrl);
}
