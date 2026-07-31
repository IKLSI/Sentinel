using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.Settings;

namespace Sentinel.Application.Jobs;

public class SendEmailVerificationJob
{
    private readonly IEmailService _emailService;
    private readonly IUserRepository _userRepository;
    private readonly FrontendSettings _frontend;
    private readonly ISystemScope _systemScope;
    private readonly QueuedTokenProtector _tokenProtector;
    private readonly ILogger<SendEmailVerificationJob> _logger;

    public SendEmailVerificationJob(
        IEmailService emailService,
        IUserRepository userRepository,
        IOptions<FrontendSettings> frontendOptions,
        ISystemScope systemScope,
        QueuedTokenProtector tokenProtector,
        ILogger<SendEmailVerificationJob> logger)
    {
        _emailService = emailService;
        _userRepository = userRepository;
        _frontend = frontendOptions.Value;
        _systemScope = systemScope;
        _tokenProtector = tokenProtector;
        _logger = logger;
    }

    public async Task ExecuteAsync(string email, string protectedToken)
    {
        string? rawToken = _tokenProtector.Unprotect(protectedToken);

        if (string.IsNullOrEmpty(rawToken))
        {
            _logger.LogWarning("Email verification token could not be decrypted, email not sent");
            return;
        }

        string? language;

        using (_systemScope.Enter())
        {
            language = await _userRepository.GetLanguageByEmailOrDefaultAsync(email, CancellationToken.None);
        }

        string culture = language ?? LanguageValues.Fr;

        await _emailService.SendEmailVerificationAsync(email, rawToken, _frontend.BaseUrl, culture);
    }
}
