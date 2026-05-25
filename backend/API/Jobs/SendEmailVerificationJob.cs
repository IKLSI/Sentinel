using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Sentinel.Application.Services;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;
using Sentinel.Domain.Settings;
using Sentinel.Infrastructure.Data;

namespace Sentinel.API.Jobs;

public class SendEmailVerificationJob
{
    private readonly SentinelContext _context;
    private readonly IEmailService _emailService;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<SendEmailVerificationJob> _logger;
    private readonly ISystemScope _systemScope;

    public SendEmailVerificationJob(
        SentinelContext context,
        IEmailService emailService,
        IOptions<FrontendSettings> frontendOptions,
        ILogger<SendEmailVerificationJob> logger,
        ISystemScope systemScope)
    {
        _context = context;
        _emailService = emailService;
        _frontend = frontendOptions.Value;
        _logger = logger;
        _systemScope = systemScope;
    }

    public async Task ExecuteAsync(Guid tokenId)
    {
        using IDisposable elevation = _systemScope.Enter();

        EmailVerificationToken? token = await _context.EmailVerificationTokens
            .FirstOrDefaultAsync(t => t.Id == tokenId);

        if (token == null)
        {
            _logger.LogWarning("Token de vérification {TokenId} introuvable", tokenId);
            return;
        }

        await _emailService.SendEmailVerificationAsync(token.Email, token.Token, _frontend.BaseUrl);
    }
}
