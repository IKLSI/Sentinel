using FluentAssertions;
using Sentinel.Domain.Git;

namespace Sentinel.Tests.Services;

public class RepositoryLocationTests
{
    [Theory]
    [InlineData("https://github.com/Owner/Repo", "github.com", "Owner", "Repo")]
    [InlineData("https://github.com/Owner/Repo.git", "github.com", "Owner", "Repo")]
    [InlineData("https://GitLab.com/groupe/projet/", "gitlab.com", "groupe", "projet")]
    [InlineData("https://github.com/Owner/Repo/tree/main", "github.com", "Owner", "Repo")]
    [InlineData("https://git.entreprise.fr/groupe/sous-groupe/projet.git", "git.entreprise.fr", "groupe/sous-groupe", "projet")]
    [InlineData("https://git.entreprise.fr/groupe/sous-groupe/projet/-/tree/main", "git.entreprise.fr", "groupe/sous-groupe", "projet")]
    public void TryParse_WhenUrlIsValid_ExtractsHostOwnerAndRepository(
        string url, string host, string owner, string repository)
    {
        bool parsed = RepositoryLocation.TryParse(url, out RepositoryLocation location);

        parsed.Should().BeTrue();
        location.Should().Be(new RepositoryLocation(host, owner, repository));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("pas-une-url")]
    [InlineData("https://github.com/Owner")]
    public void TryParse_WhenUrlIsInvalid_ReturnsFalse(string? url)
    {
        bool parsed = RepositoryLocation.TryParse(url, out RepositoryLocation location);

        parsed.Should().BeFalse();
        location.Should().Be(default(RepositoryLocation));
    }

    [Theory]
    [InlineData("https://github.com/acme/app/tree/release/services/billing", "release", "services/billing")]
    [InlineData("https://gitlab.com/group/app/-/tree/develop", "develop", null)]
    [InlineData("https://github.com/acme/app", null, null)]
    public void ReadTreeReference_ExtractsTheBranchAndFolder(string url, string? branch, string? path)
    {
        RepositoryLocation.ReadTreeReference(url).Should().Be((branch, path));
    }
}
