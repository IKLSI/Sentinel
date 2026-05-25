using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sentinel.Application.Services;
using Sentinel.Domain.Models;
using Sentinel.Domain.Settings;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Jobs;

public class SendPasswordResetEmailJob
{
    private readonly SentinelContext _context;
    private readonly IEmailService _emailService;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<SendPasswordResetEmailJob> _logger;

    public SendPasswordResetEmailJob(
        SentinelContext context,
        IEmailService emailService,
        IOptions<FrontendSettings> frontendOptions,
        ILogger<SendPasswordResetEmailJob> logger)
    {
        _context = context;
        _emailService = emailService;
        _frontend = frontendOptions.Value;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid tokenId)
    {
        PasswordResetToken? resetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Id == tokenId);

        if (resetToken == null)
        {
            _logger.LogWarning("PasswordResetToken {TokenId} introuvable", tokenId);
            return;
        }

        await _emailService.SendPasswordResetAsync(
            resetToken.Email,
            resetToken.Token,
            _frontend.BaseUrl
        );
    }
}
