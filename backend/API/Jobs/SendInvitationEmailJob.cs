using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Services;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Jobs;

public class SendInvitationEmailJob
{
    private readonly SentinelContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SendInvitationEmailJob> _logger;
    private readonly ISystemScope _systemScope;

    public SendInvitationEmailJob(
        SentinelContext context,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<SendInvitationEmailJob> logger,
        ISystemScope systemScope)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
        _systemScope = systemScope;
    }

    public async Task ExecuteAsync(Guid invitationId)
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

        string frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";

        await _emailService.SendInvitationAsync(
            invitation,
            invitation.Organization.Name,
            invitation.InvitedBy.FullName,
            frontendBaseUrl
        );
    }
}
