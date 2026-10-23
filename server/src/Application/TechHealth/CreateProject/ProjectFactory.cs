using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.CreateProject;

public static class ProjectFactory
{
    public static Project Create(Guid organizationId, CreateProjectDto model)
    {
        RepositoryType repositoryType = RepositoryLocation.TryParse(model.RepositoryUrl, out RepositoryLocation location)
            && !RepositoryHosts.IsGitHub(location.Host)
                ? RepositoryType.GitLab
                : RepositoryType.GitHub;

        if (!EnumValue.TryParse(model.ScanFrequency, out ScanFrequency scanFrequency))
            scanFrequency = ScanFrequency.Weekly;

        (string? branch, string? rootPath) = RepositoryLocation.ReadTreeReference(model.RepositoryUrl);

        return new Project
        {
            OrganizationId = organizationId,
            Name = model.Name,
            RepositoryUrl = model.RepositoryUrl,
            Branch = branch,
            RootPath = RepositoryScanPaths.NormalizeRootPath(rootPath),
            RepositoryType = repositoryType,
            ScanFrequency = scanFrequency
        };
    }
}
