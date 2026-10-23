using Microsoft.Extensions.Options;
using Sentinel.Application.Options;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs;

public class SendPasswordResetEmailJob(
    IEmailService emailService,
    IUserRepository userRepository,
    IOptions<FrontendSettings> frontendOptions,
    ISystemScope systemScope,
    QueuedTokenProtector tokenProtector)
    : TokenEmailJob(emailService, userRepository, frontendOptions, systemScope, tokenProtector)
{
    protected override Task SendAsync(IEmailService emailService, string email, string rawToken, string baseUrl,
        string culture, CancellationToken cancellationToken) =>
        emailService.SendPasswordResetAsync(email, rawToken, baseUrl, culture, cancellationToken);
}
