namespace Sentinel.Domain.Git;

public sealed record RepositoryAccess(string? Token, GitLabInstance GitLab)
{
    public static readonly RepositoryAccess Anonymous = new(null, GitLabInstance.Public);
}
