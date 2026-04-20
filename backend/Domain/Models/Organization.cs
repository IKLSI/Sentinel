namespace Sentinel.Domain.Models;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string Timezone { get; set; } = "Europe/Paris";
    public int SlaCriticalHours { get; set; } = 4;
    public int SlaHighHours { get; set; } = 8;
    public int SlaMediumHours { get; set; } = 24;
    public int SlaLowHours { get; set; } = 48;
    public string? GithubToken { get; set; }
    public string? GitlabToken { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
}
