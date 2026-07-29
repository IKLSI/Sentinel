using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Settings;

namespace Sentinel.Application.Jobs;

public class SendPasswordResetEmailJob
{
    private readonly IEmailService _emailService;
    private readonly FrontendSettings _frontend;

    public SendPasswordResetEmailJob(
        IEmailService emailService,
        IOptions<FrontendSettings> frontendOptions)
    {
        _emailService = emailService;
        _frontend = frontendOptions.Value;
    }

    public async Task ExecuteAsync(string email, string rawToken)
    {
        await _emailService.SendPasswordResetAsync(email, rawToken, _frontend.BaseUrl);
    }
}
