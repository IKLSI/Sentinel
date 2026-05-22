namespace Sentinel.Domain.Models;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Timezone { get; set; } = "Europe/Paris";
    public string? GithubToken { get; set; }
    public string? GithubAccountId { get; set; }
    public string? GithubAccountLogin { get; set; }
    public DateTime? GithubConnectedAt { get; set; }
    public Guid? GithubConnectedById { get; set; }
    public string? GitlabToken { get; set; }
    public string? GitlabAccountId { get; set; }
    public string? GitlabAccountLogin { get; set; }
    public DateTime? GitlabConnectedAt { get; set; }
    public Guid? GitlabConnectedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
}
