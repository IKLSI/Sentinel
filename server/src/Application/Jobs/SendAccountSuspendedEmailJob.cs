using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs;

public class SendAccountSuspendedEmailJob
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly ISystemScope _systemScope;
    private readonly ILogger<SendAccountSuspendedEmailJob> _logger;

    public SendAccountSuspendedEmailJob(
        IUserRepository userRepository,
        IEmailService emailService,
        ISystemScope systemScope,
        ILogger<SendAccountSuspendedEmailJob> logger)
    {
        _userRepository = userRepository;
        _emailService = emailService;
        _systemScope = systemScope;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid userId, CancellationToken cancellationToken)
    {
        User? user;

        using (_systemScope.Enter())
        {
            user = await _userRepository.GetOrDefaultWithOrganizationAsync(userId, cancellationToken);
        }

        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found for suspension email", userId);
            return;
        }

        if (user.AccessStatus == UserAccessStatus.Active)
        {
            _logger.LogInformation("User {UserId} reactivated before the suspension email was sent", userId);
            return;
        }

        await _emailService.SendAccountSuspendedAsync(user.Email, user.Organization.Name, user.Language,
            cancellationToken);
    }
}
