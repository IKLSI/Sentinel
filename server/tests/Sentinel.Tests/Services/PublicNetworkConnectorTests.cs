using System.Net;
using FluentAssertions;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class PublicNetworkConnectorTests
{
    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("10.1.2.3")]
    [InlineData("172.20.0.1")]
    [InlineData("192.168.1.10")]
    [InlineData("169.254.169.254")]
    [InlineData("100.64.0.1")]
    [InlineData("0.0.0.0")]
    [InlineData("::1")]
    [InlineData("fd00::1")]
    [InlineData("fe80::1")]
    [InlineData("::ffff:127.0.0.1")]
    public void IsPublic_NonPublicAddress_ReturnsFalse(string address)
    {
        PublicNetworkConnector.IsPublic(IPAddress.Parse(address)).Should().BeFalse();
    }

    [Theory]
    [InlineData("1.1.1.1")]
    [InlineData("140.82.112.3")]
    [InlineData("2606:4700:4700::1111")]
    public void IsPublic_PublicAddress_ReturnsTrue(string address)
    {
        PublicNetworkConnector.IsPublic(IPAddress.Parse(address)).Should().BeTrue();
    }
}
