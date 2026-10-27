using Sentinel.Application.Security;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;

namespace Sentinel.Application.Projects;

public static class RepositoryAccessFactory
{
    public static RepositoryAccess For(Project project, Organization? organization, TokenProtector tokenProtector)
    {
        if (organization == null) return RepositoryAccess.Anonymous;

        string? stored = project.RepositoryType == RepositoryType.GitLab
            ? organization.GitlabToken
            : organization.GithubToken;

        return new RepositoryAccess(tokenProtector.Unprotect(stored), organization.ToGitLabInstance());
    }
}
