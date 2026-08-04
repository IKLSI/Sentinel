namespace Sentinel.Application.TechHealth.AvailableRepos;

public class AvailableRepoDto
{
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
}

public class AvailableReposResponse
{
    public List<AvailableRepoDto> Repos { get; set; } = new();
    public bool HasToken { get; set; }
    public bool FetchFailed { get; set; }
    public int? FetchFailedStatusCode { get; set; }
    public bool Truncated { get; set; }
}
