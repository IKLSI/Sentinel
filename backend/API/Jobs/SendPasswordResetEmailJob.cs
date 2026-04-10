using Microsoft.EntityFrameworkCore;
using Sentinel.Application.Services;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Jobs;

public class SendPasswordResetEmailJob
{
    private readonly SentinelContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SendPasswordResetEmailJob> _logger;

    public SendPasswordResetEmailJob(
        SentinelContext context,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<SendPasswordResetEmailJob> logger)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
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

        string frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";

        await _emailService.SendPasswordResetAsync(
            resetToken.Email,
            resetToken.Token,
            frontendBaseUrl
        );
    }
}
