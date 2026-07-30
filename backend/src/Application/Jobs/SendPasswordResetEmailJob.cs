using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.Settings;

namespace Sentinel.Application.Jobs;

public class SendPasswordResetEmailJob
{
    private readonly IEmailService _emailService;
    private readonly IUserRepository _userRepository;
    private readonly FrontendSettings _frontend;
    private readonly ISystemScope _systemScope;

    public SendPasswordResetEmailJob(
        IEmailService emailService,
        IUserRepository userRepository,
        IOptions<FrontendSettings> frontendOptions,
        ISystemScope systemScope)
    {
        _emailService = emailService;
        _userRepository = userRepository;
        _frontend = frontendOptions.Value;
        _systemScope = systemScope;
    }

    public async Task ExecuteAsync(string email, string rawToken)
    {
        using IDisposable elevation = _systemScope.Enter();

        string culture = await _userRepository.GetLanguageByEmailOrDefaultAsync(email, CancellationToken.None)
            ?? LanguageValues.Fr;

        await _emailService.SendPasswordResetAsync(email, rawToken, _frontend.BaseUrl, culture);
    }
}
