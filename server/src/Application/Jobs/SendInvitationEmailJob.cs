using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Application.Options;

namespace Sentinel.Application.Jobs;

public class SendInvitationEmailJob(
    IUserInvitationRepository invitationRepository,
    IEmailService emailService,
    IOptions<FrontendSettings> frontendOptions,
    ILogger<SendInvitationEmailJob> logger,
    ISystemScope systemScope,
    QueuedTokenProtector tokenProtector)
{
    public async Task ExecuteAsync(Guid invitationId, string protectedToken, CancellationToken cancellationToken)
    {
        string? rawToken = tokenProtector.Unprotect(protectedToken);

        if (string.IsNullOrEmpty(rawToken))
            throw new UndecryptableQueuedTokenException(nameof(SendInvitationEmailJob));

        UserInvitation? invitation;

        using (systemScope.Enter())
        {
            invitation = await invitationRepository
                .GetOrDefaultWithOrganizationAndInviterAsync(invitationId, cancellationToken);
        }

        if (invitation == null)
        {
            logger.LogWarning("Invitation {InvitationId} not found", invitationId);
            return;
        }

        await emailService.SendInvitationAsync(
            invitation,
            rawToken,
            invitation.Organization.Name,
            invitation.InvitedBy.FullName,
            frontendOptions.Value.BaseUrl,
            invitation.InvitedBy.Language,
            cancellationToken
        );
    }
}
