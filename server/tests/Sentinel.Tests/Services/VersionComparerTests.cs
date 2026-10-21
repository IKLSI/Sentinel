using FluentAssertions;
using Sentinel.Domain.Versioning;

namespace Sentinel.Tests.Services;

public class VersionComparerTests
{
    [Theory]
    [InlineData("1.0.0", "1.0.0", 0)]
    [InlineData("1.2.0", "1.10.0", -1)]
    [InlineData("1.10.0", "1.2.0", 1)]
    [InlineData("2.0.0", "1.99.99", 1)]
    [InlineData("1.0", "1.0.0", 0)]
    [InlineData("v1.2.3", "1.2.3", 0)]
    [InlineData("1.2.3+build.5", "1.2.3", 0)]
    [InlineData("1.0.0-rc.1", "1.0.0", -1)]
    [InlineData("1.0.0", "1.0.0-rc.1", 1)]
    [InlineData("1.0.0-alpha", "1.0.0-beta", -1)]
    [InlineData("1.0.0-rc.2", "1.0.0-rc.10", -1)]
    [InlineData("1.0.0-alpha", "1.0.0-alpha.1", -1)]
    [InlineData("1.2.3.RELEASE", "1.2.3", 0)]
    [InlineData("", "", 0)]
    [InlineData("2.0rc1", "2.0", -1)]
    [InlineData("1.0.post1", "1.0", 1)]
    [InlineData("1.0.dev1", "1.0a1", -1)]
    [InlineData("1.0a1", "1.0b1", -1)]
    [InlineData("1.0b2", "1.0rc1", -1)]
    [InlineData("1!1.0", "2.0", 1)]
    [InlineData("1.0.Final", "1.0.0", 0)]
    [InlineData("1.0-SNAPSHOT", "1.0", -1)]
    [InlineData("1.0-alpha-1", "1.0-beta-1", -1)]
    [InlineData("1.0.sp1", "1.0", 1)]
    [InlineData("1.2.3.rc1", "1.2.3", -1)]
    [InlineData("1.2.3.pre1", "1.2.3.rc1", 0)]
    [InlineData("1.0.1", "1.0rc1", 1)]
    [InlineData("1.0.0-alpha.1", "1.0.0-alpha.beta", -1)]
    [InlineData("1.0.0-canary", "1.0.0", -1)]
    [InlineData("1.99999999999", "1.2147483648", 1)]
    [InlineData("1.01", "1.1", 0)]
    public void Compare_OrdersVersionsBySemanticRules(string left, string right, int expected)
    {
        Math.Sign(VersionComparer.Instance.Compare(left, right)).Should().Be(expected);
    }

    [Fact]
    public void Compare_IsAntisymmetric()
    {
        string[] versions = ["1.0.0-rc.1", "1.0.0", "1.10.0", "0.9.9", "2.0.0-beta.2", "2.0.0"];

        foreach (string left in versions)
        {
            foreach (string right in versions)
            {
                Math.Sign(VersionComparer.Instance.Compare(left, right))
                    .Should().Be(-Math.Sign(VersionComparer.Instance.Compare(right, left)));
            }
        }
    }

    [Fact]
    public void Compare_SortsAscending()
    {
        List<string> versions = ["2.0.0", "1.0.0-rc.1", "1.10.0", "1.2.0", "1.0.0"];

        versions.Sort(VersionComparer.Instance);

        versions.Should().ContainInOrder("1.0.0-rc.1", "1.0.0", "1.2.0", "1.10.0", "2.0.0");
    }
}
