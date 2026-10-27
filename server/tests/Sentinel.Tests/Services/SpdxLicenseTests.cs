using FluentAssertions;
using Sentinel.Application.Sbom;

namespace Sentinel.Tests.Services;

public class SpdxLicenseTests
{
    [Theory]
    [InlineData("MIT License", "MIT")]
    [InlineData("Apache License 2.0", "Apache-2.0")]
    [InlineData("apache-2.0", "Apache-2.0")]
    [InlineData("GPLv3", "GPL-3.0-only")]
    [InlineData("BSD License", "BSD-3-Clause")]
    public void IdOf_KnownVariant_ReturnsTheSpdxIdentifier(string license, string expected)
    {
        SpdxLicense.IdOf(license).Should().Be(expected);
    }

    [Fact]
    public void ExpressionOf_CompoundLicense_NormalizesEachTerm()
    {
        SpdxLicense.ExpressionOf("MIT License or Apache 2.0").Should().Be("MIT OR Apache-2.0");
    }

    [Fact]
    public void ExpressionOf_UnknownLicense_ReturnsNull()
    {
        SpdxLicense.ExpressionOf("Proprietary custom terms").Should().BeNull();
    }
}
