using FluentAssertions;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class RepositoryScanPathsTests
{
    [Fact]
    public void ProjectDirectories_ListsManifestDirectoriesOutsideTestFolders()
    {
        List<string> directories = RepositoryScanPaths.ProjectDirectories([
            "package.json",
            "apps/web/package.json",
            "apps/web/package-lock.json",
            "apps/api/pom.xml",
            "packages/ui/test/fixtures/package.json",
            "Apps/Web/Dockerfile",
        ]);

        directories.Should().Equal("apps/api", "apps/web");
    }
}
