using Microsoft.Extensions.Options;
using Sentinel.Application.Options;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs;

public abstract class TokenEmailJob(
    IEmailService emailService,
    IUserRepository userRepository,
    IOptions<FrontendSettings> frontendOptions,
    ISystemScope systemScope,
    QueuedTokenProtector tokenProtector)
{
    public async Task ExecuteAsync(string email, string protectedToken, CancellationToken cancellationToken)
    {
        string? rawToken = tokenProtector.Unprotect(protectedToken);

        if (string.IsNullOrEmpty(rawToken))
            throw new UndecryptableQueuedTokenException(GetType().Name);

        string? language;

        using (systemScope.Enter())
        {
            language = await userRepository.GetLanguageByEmailOrDefaultAsync(email, cancellationToken);
        }

        await SendAsync(emailService, email, rawToken, frontendOptions.Value.BaseUrl, language ?? LanguageValues.Fr,
            cancellationToken);
    }

    protected abstract Task SendAsync(IEmailService emailService, string email, string rawToken, string baseUrl,
        string culture, CancellationToken cancellationToken);
}
