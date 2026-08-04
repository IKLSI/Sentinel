using Microsoft.Extensions.Options;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Application.Options;

namespace Sentinel.Application.Jobs;

public class SendPasswordResetEmailJob
{
    private readonly IEmailService _emailService;
    private readonly IUserRepository _userRepository;
    private readonly FrontendSettings _frontend;
    private readonly ISystemScope _systemScope;
    private readonly QueuedTokenProtector _tokenProtector;

    public SendPasswordResetEmailJob(
        IEmailService emailService,
        IUserRepository userRepository,
        IOptions<FrontendSettings> frontendOptions,
        ISystemScope systemScope,
        QueuedTokenProtector tokenProtector)
    {
        _emailService = emailService;
        _userRepository = userRepository;
        _frontend = frontendOptions.Value;
        _systemScope = systemScope;
        _tokenProtector = tokenProtector;
    }

    public async Task ExecuteAsync(string email, string protectedToken)
    {
        string? rawToken = _tokenProtector.Unprotect(protectedToken);

        if (string.IsNullOrEmpty(rawToken))
            throw new UndecryptableQueuedTokenException(nameof(SendPasswordResetEmailJob));

        string? language;

        using (_systemScope.Enter())
        {
            language = await _userRepository.GetLanguageByEmailOrDefaultAsync(email, CancellationToken.None);
        }

        string culture = language ?? LanguageValues.Fr;

        await _emailService.SendPasswordResetAsync(email, rawToken, _frontend.BaseUrl, culture);
    }
}
