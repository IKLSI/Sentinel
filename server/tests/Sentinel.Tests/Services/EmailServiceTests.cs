using FluentAssertions;
using MailKit.Security;
using Sentinel.Infrastructure.Email;

namespace Sentinel.Tests.Services;

public class EmailServiceTests
{
    [Fact]
    public void SocketOptionsFor_ImplicitTlsPort_ConnectsOverTls()
    {
        EmailService.SocketOptionsFor(465).Should().Be(SecureSocketOptions.SslOnConnect);
    }

    [Theory]
    [InlineData(587)]
    [InlineData(25)]
    public void SocketOptionsFor_SubmissionPorts_RequireStartTls(int port)
    {
        EmailService.SocketOptionsFor(port).Should().Be(SecureSocketOptions.StartTls);
    }
}
