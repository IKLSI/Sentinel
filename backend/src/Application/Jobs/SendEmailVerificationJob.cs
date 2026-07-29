using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Application.Audit;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Application.Notifications;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Domain.Settings;

namespace Sentinel.Application.Jobs;

public class SendEmailVerificationJob
{
    private readonly IEmailService _emailService;
    private readonly FrontendSettings _frontend;

    public SendEmailVerificationJob(
        IEmailService emailService,
        IOptions<FrontendSettings> frontendOptions)
    {
        _emailService = emailService;
        _frontend = frontendOptions.Value;
    }

    public async Task ExecuteAsync(string email, string rawToken)
    {
        await _emailService.SendEmailVerificationAsync(email, rawToken, _frontend.BaseUrl);
    }
}
