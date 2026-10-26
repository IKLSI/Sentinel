using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs;

public class SendAccountSuspendedEmailJob(
    IUserRepository userRepository,
    IEmailService emailService,
    ISystemScope systemScope,
    ILogger<SendAccountSuspendedEmailJob> logger)
{
    public async Task ExecuteAsync(Guid userId, CancellationToken cancellationToken)
    {
        User? user;

        using (systemScope.Enter())
        {
            user = await userRepository.GetOrDefaultWithOrganizationAsync(userId, cancellationToken);
        }

        if (user == null)
        {
            logger.LogWarning("User {UserId} not found for suspension email", userId);
            return;
        }

        if (user.AccessStatus == UserAccessStatus.Active)
        {
            logger.LogInformation("User {UserId} reactivated before the suspension email was sent", userId);
            return;
        }

        await emailService.SendAccountSuspendedAsync(user.Email, user.Organization.Name, user.Language,
            cancellationToken);
    }
}
