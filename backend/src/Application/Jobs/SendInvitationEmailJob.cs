using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.Settings;

namespace Sentinel.Application.Jobs;

public class SendInvitationEmailJob
{
    private readonly IUserInvitationRepository _invitationRepository;
    private readonly IEmailService _emailService;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<SendInvitationEmailJob> _logger;
    private readonly ISystemScope _systemScope;

    public SendInvitationEmailJob(
        IUserInvitationRepository invitationRepository,
        IEmailService emailService,
        IOptions<FrontendSettings> frontendOptions,
        ILogger<SendInvitationEmailJob> logger,
        ISystemScope systemScope)
    {
        _invitationRepository = invitationRepository;
        _emailService = emailService;
        _frontend = frontendOptions.Value;
        _logger = logger;
        _systemScope = systemScope;
    }

    public async Task ExecuteAsync(Guid invitationId, string rawToken)
    {
        using IDisposable elevation = _systemScope.Enter();

        UserInvitation? invitation = await _invitationRepository
            .GetOrDefaultWithOrganizationAndInviterAsync(invitationId, CancellationToken.None);

        if (invitation == null)
        {
            _logger.LogWarning("Invitation {InvitationId} introuvable", invitationId);
            return;
        }

        await _emailService.SendInvitationAsync(
            invitation,
            rawToken,
            invitation.Organization.Name,
            invitation.InvitedBy.FullName,
            _frontend.BaseUrl
        );
    }
}
