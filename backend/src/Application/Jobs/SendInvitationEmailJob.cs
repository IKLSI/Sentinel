using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Security;
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
    private readonly QueuedTokenProtector _tokenProtector;

    public SendInvitationEmailJob(
        IUserInvitationRepository invitationRepository,
        IEmailService emailService,
        IOptions<FrontendSettings> frontendOptions,
        ILogger<SendInvitationEmailJob> logger,
        ISystemScope systemScope,
        QueuedTokenProtector tokenProtector)
    {
        _invitationRepository = invitationRepository;
        _emailService = emailService;
        _frontend = frontendOptions.Value;
        _logger = logger;
        _systemScope = systemScope;
        _tokenProtector = tokenProtector;
    }

    public async Task ExecuteAsync(Guid invitationId, string protectedToken)
    {
        string? rawToken = _tokenProtector.Unprotect(protectedToken);

        if (string.IsNullOrEmpty(rawToken))
        {
            _logger.LogWarning("Invitation token for {InvitationId} could not be decrypted, email not sent", invitationId);
            return;
        }

        UserInvitation? invitation;

        using (_systemScope.Enter())
        {
            invitation = await _invitationRepository
                .GetOrDefaultWithOrganizationAndInviterAsync(invitationId, CancellationToken.None);
        }

        if (invitation == null)
        {
            _logger.LogWarning("Invitation {InvitationId} not found", invitationId);
            return;
        }

        await _emailService.SendInvitationAsync(
            invitation,
            rawToken,
            invitation.Organization.Name,
            invitation.InvitedBy.FullName,
            _frontend.BaseUrl,
            invitation.InvitedBy.Language
        );
    }
}
