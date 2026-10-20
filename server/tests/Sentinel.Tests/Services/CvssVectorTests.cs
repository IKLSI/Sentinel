using FluentAssertions;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class CvssVectorTests
{
    [Theory]
    [InlineData("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H", 10.0)]
    [InlineData("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", 9.8)]
    [InlineData("CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:H/I:H/A:H", 9.0)]
    [InlineData("CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L", 4.3)]
    [InlineData("CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N", 1.8)]
    [InlineData("CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", 9.8)]
    [InlineData("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N", 0.0)]
    [InlineData("CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N", 9.8)]
    [InlineData("CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:A/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N", 3.7)]
    public void TryComputeBaseScore_MatchesThePublishedScore(string vector, double expected)
    {
        CvssVector.TryComputeBaseScore(vector).Should().Be((decimal)expected);
    }

    [Theory]
    [InlineData("CVSS:4.0/AV:N/AC:L/PR:N")]
    [InlineData("AV:N/AC:L/Au:N/C:P/I:P/A:P")]
    [InlineData("CVSS:3.1/AV:N/AC:L/PR:N")]
    [InlineData("CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")]
    [InlineData("not a vector")]
    [InlineData("")]
    [InlineData(null)]
    public void TryComputeBaseScore_UnsupportedOrIncompleteVector_ReturnsNull(string? vector)
    {
        CvssVector.TryComputeBaseScore(vector).Should().BeNull();
    }

    [Fact]
    public void TryComputeBaseScore_NeverExceedsTheScale()
    {
        string[] vectors =
        [
            "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
            "CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:L",
        ];

        foreach (string vector in vectors)
        {
            decimal? score = CvssVector.TryComputeBaseScore(vector);

            score.Should().NotBeNull();
            score!.Value.Should().BeInRange(0m, 10m);
        }
    }
}
