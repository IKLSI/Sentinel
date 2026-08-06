using FluentAssertions;
using Sentinel.Domain.Git;

namespace Sentinel.Tests.Services;

public class RepositoryLocationTests
{
    [Theory]
    [InlineData("https://github.com/Owner/Repo", "github.com", "Owner", "Repo")]
    [InlineData("https://github.com/Owner/Repo.git", "github.com", "Owner", "Repo")]
    [InlineData("https://GitLab.com/groupe/projet/", "gitlab.com", "groupe", "projet")]
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
}
