using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Jobs;

public class SendAccountDeactivatedEmailJob
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly ISystemScope _systemScope;
    private readonly ILogger<SendAccountDeactivatedEmailJob> _logger;

    public SendAccountDeactivatedEmailJob(
        IUserRepository userRepository,
        IEmailService emailService,
        ISystemScope systemScope,
        ILogger<SendAccountDeactivatedEmailJob> logger)
    {
        _userRepository = userRepository;
        _emailService = emailService;
        _systemScope = systemScope;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid userId)
    {
        User? user;

        using (_systemScope.Enter())
        {
            user = await _userRepository.GetOrDefaultWithOrganizationAsync(userId, CancellationToken.None);
        }

        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found for deactivation email", userId);
            return;
        }

        if (user.IsActive)
        {
            _logger.LogInformation("User {UserId} reactivated before the deactivation email was sent", userId);
            return;
        }

        await _emailService.SendAccountDeactivatedAsync(user.Email, user.Organization.Name, user.Language);
    }
}
