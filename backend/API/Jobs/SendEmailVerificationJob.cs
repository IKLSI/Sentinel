using Microsoft.Extensions.Options;
using Sentinel.Application.Services;
using Sentinel.Domain.Settings;

namespace Sentinel.API.Jobs;

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
