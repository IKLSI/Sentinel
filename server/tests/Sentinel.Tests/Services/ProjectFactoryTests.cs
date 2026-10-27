using FluentAssertions;
using Sentinel.Application.Projects.Create;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class ProjectFactoryTests
{
    [Theory]
    [InlineData("https://github.com/acme/app", "GitLab", RepositoryType.GitHub)]
    [InlineData("https://gitlab.com/acme/app", "GitHub", RepositoryType.GitLab)]
    [InlineData("https://gitlab.example.org/acme/app", "GitHub", RepositoryType.GitLab)]
    public void Create_DerivesTheRepositoryTypeFromTheHostNotFromTheRequest(string url, string declaredType,
        RepositoryType expected)
    {
        Project project = ProjectFactory.Create(Guid.NewGuid(),
            new CreateProjectDto { Name = "app", RepositoryUrl = url, RepositoryType = declaredType });

        project.RepositoryType.Should().Be(expected);
    }
}
