using Microsoft.Extensions.Options;
using Sentinel.Application.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth;

public class ExistingAccountNotifier(
    IUserRepository userRepository,
    IJobScheduler jobs,
    IOptions<FrontendSettings> frontendOptions)
{
    public async Task NotifyAsync(string email, CancellationToken cancellationToken)
    {
        string? language = await userRepository.GetLanguageByEmailOrDefaultAsync(email, cancellationToken);
        string frontendBaseUrl = frontendOptions.Value.BaseUrl;
        string culture = language ?? LanguageValues.Fr;

        jobs.Enqueue<IEmailService>(JobQueues.Emails, s => s.SendExistingAccountNoticeAsync(email, frontendBaseUrl, culture,
            CancellationToken.None));
    }
}
