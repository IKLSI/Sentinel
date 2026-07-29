using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sentinel.Application.Services;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;
using Sentinel.Domain.Settings;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Jobs;

public class SendInvitationEmailJob
{
    private readonly SentinelContext _context;
    private readonly IEmailService _emailService;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<SendInvitationEmailJob> _logger;
    private readonly ISystemScope _systemScope;

    public SendInvitationEmailJob(
        SentinelContext context,
        IEmailService emailService,
        IOptions<FrontendSettings> frontendOptions,
        ILogger<SendInvitationEmailJob> logger,
        ISystemScope systemScope)
    {
        _context = context;
        _emailService = emailService;
        _frontend = frontendOptions.Value;
        _logger = logger;
        _systemScope = systemScope;
    }

    public async Task ExecuteAsync(Guid invitationId, string rawToken)
    {
        using IDisposable elevation = _systemScope.Enter();

        UserInvitation? invitation = await _context.UserInvitations
            .Include(i => i.Organization)
            .Include(i => i.InvitedBy)
            .FirstOrDefaultAsync(i => i.Id == invitationId);

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
