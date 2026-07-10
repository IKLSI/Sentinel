using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Settings;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Auth;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class AuthService
{
    private readonly SentinelContext _context;
    private readonly TokenService _tokenService;
    private readonly JwtSettings _jwt;
    private readonly ILogger<AuthService> _logger;
    private readonly ISystemScope _systemScope;

    public AuthService(SentinelContext context, TokenService tokenService, IOptions<JwtSettings> jwtOptions, ILogger<AuthService> logger, ISystemScope systemScope)
    {
        _context = context;
        _tokenService = tokenService;
        _jwt = jwtOptions.Value;
        _logger = logger;
        _systemScope = systemScope;
    }

    private int RefreshTokenExpirationDays => _jwt.RefreshTokenExpirationDays > 0 ? _jwt.RefreshTokenExpirationDays : 30;

    public async Task<(string Email, string RawToken)?> CreatePasswordResetTokenAsync(string email)
    {
        using IDisposable elevation = _systemScope.Enter();

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLower() && u.IsActive);

        if (user == null) return null;

        await _context.PasswordResetTokens
            .Where(t => t.Email == email.ToLower() && !t.IsUsed)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsUsed, true));

        string rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(48));

        PasswordResetToken resetToken = new PasswordResetToken
        {
            Email = email.ToLower(),
            TokenHash = HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        return (resetToken.Email, rawToken);
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        using IDisposable elevation = _systemScope.Enter();

        string tokenHash = HashToken(token);

        PasswordResetToken? resetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

        if (resetToken == null) return false;

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == resetToken.Email && u.IsActive);

        if (user == null) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.TokenVersion++;

        resetToken.IsUsed = true;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Mot de passe réinitialisé pour {Email}", user.Email);
        return true;
    }

    public async Task<LoginResponse?> LoginAsync(string email, string password)
    {
        using IDisposable elevation = _systemScope.Enter();

        string normalizedEmail = email.ToLower();
        List<User> candidates = await _context.Users
            .Where(u => u.Email == normalizedEmail && u.IsActive)
            .ToListAsync();

        User? user = null;

        foreach (User candidate in candidates)
        {
            if (BCrypt.Net.BCrypt.Verify(password, candidate.PasswordHash))
            {
                if (user != null)
                {
                    _logger.LogWarning("Plusieurs comptes correspondent au login {Email} — connexion refusée par ambiguïté", normalizedEmail);
                    return null;
                }

                user = candidate;
            }
        }

        if (user == null)
        {
            return null;
        }

        if (!user.IsEmailVerified)
        {
            throw new EmailNotVerifiedException("Votre adresse email n'a pas encore été vérifiée. Consultez votre boîte de réception ou demandez un nouveau lien.");
        }

        string accessToken = _tokenService.GenerateAccessToken(user);
        string refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = _tokenService.HashRefreshToken(refreshToken);
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(RefreshTokenExpirationDays);
        user.LastLoginAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = _tokenService.GetAccessTokenExpiry(),
            User = new UserProfile
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                OrganizationId = user.OrganizationId,
                Theme = user.Theme.ToString().ToLowerInvariant()
            }
        };
    }

    public async Task<LoginResponse?> RefreshTokenAsync(string refreshToken)
    {
        using IDisposable elevation = _systemScope.Enter();

        string tokenHash = _tokenService.HashRefreshToken(refreshToken);

        User? user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.RefreshToken == tokenHash
                && u.RefreshTokenExpiry > DateTime.UtcNow
                && u.IsActive);

        if (user == null)
        {
            User? replayUser = await _context.Users
                .FirstOrDefaultAsync(u => u.PreviousRefreshTokenHash == tokenHash && u.IsActive);

            if (replayUser != null)
            {
                replayUser.RefreshToken = null;
                replayUser.RefreshTokenExpiry = null;
                await _context.SaveChangesAsync();
                _logger.LogWarning("Token replay détecté pour userId {UserId}", replayUser.Id);
            }

            return null;
        }

        string newAccessToken = _tokenService.GenerateAccessToken(user);
        string newRefreshToken = _tokenService.GenerateRefreshToken();

        user.PreviousRefreshTokenHash = user.RefreshToken;
        user.RefreshToken = _tokenService.HashRefreshToken(newRefreshToken);
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(RefreshTokenExpirationDays);

        await _context.SaveChangesAsync();

        return new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = _tokenService.GetAccessTokenExpiry(),
            User = new UserProfile
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                OrganizationId = user.OrganizationId,
                Theme = user.Theme.ToString().ToLowerInvariant()
            }
        };
    }

    public async Task LogoutAsync(Guid userId)
    {
        User? user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return;
        }

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.TokenVersion++;

        await _context.SaveChangesAsync();
    }

    public async Task<(string Email, string RawToken)> RegisterAsync(RegisterRequest request)
    {
        using IDisposable elevation = _systemScope.Enter();

        string normalizedEmail = request.Email.ToLower().Trim();

        bool emailExists = await _context.Users.AnyAsync(u => u.Email == normalizedEmail);

        if (emailExists)
            throw new InvalidOperationException("Un compte existe déjà avec cette adresse email.");

        DateTime now = DateTime.UtcNow;

        Organization organization = new Organization
        {
            Name = request.OrganizationName.Trim(),
            Slug = await GenerateUniqueSlugAsync(request.OrganizationName),
            PlanTier = PlanTier.Free,
            SubscriptionStatus = SubscriptionStatus.None,
            ScanCountPeriodStart = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.Organizations.AddAsync(organization);

        User admin = new User
        {
            OrganizationId = organization.Id,
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Role = UserRole.Admin,
            IsActive = true,
            IsEmailVerified = false,
            CreatedAt = now
        };

        await _context.Users.AddAsync(admin);
        await _context.TicketStatuses.AddRangeAsync(BuildDefaultStatuses(organization.Id));

        string rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(48));

        EmailVerificationToken verificationToken = new EmailVerificationToken
        {
            Email = normalizedEmail,
            TokenHash = HashToken(rawToken),
            ExpiresAt = now.AddHours(48)
        };

        await _context.EmailVerificationTokens.AddAsync(verificationToken);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Nouvelle organisation enregistrée {Slug} par {Email}", organization.Slug, normalizedEmail);
        return (normalizedEmail, rawToken);
    }

    public async Task<bool> VerifyEmailAsync(string token)
    {
        using IDisposable elevation = _systemScope.Enter();

        string tokenHash = HashToken(token);

        EmailVerificationToken? verificationToken = await _context.EmailVerificationTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

        if (verificationToken == null) return false;

        User? user = await _context.Users.FirstOrDefaultAsync(u => u.Email == verificationToken.Email);

        if (user == null) return false;

        user.IsEmailVerified = true;
        verificationToken.IsUsed = true;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Email vérifié pour {Email}", user.Email);
        return true;
    }

    public async Task<(string Email, string RawToken)?> ResendVerificationAsync(string email)
    {
        using IDisposable elevation = _systemScope.Enter();

        string normalizedEmail = email.ToLower().Trim();

        User? user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || user.IsEmailVerified) return null;

        await _context.EmailVerificationTokens
            .Where(t => t.Email == normalizedEmail && !t.IsUsed)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsUsed, true));

        string rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(48));

        EmailVerificationToken verificationToken = new EmailVerificationToken
        {
            Email = normalizedEmail,
            TokenHash = HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddHours(48)
        };

        await _context.EmailVerificationTokens.AddAsync(verificationToken);
        await _context.SaveChangesAsync();

        return (normalizedEmail, rawToken);
    }

    private static string HashToken(string rawToken)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private async Task<string> GenerateUniqueSlugAsync(string name)
    {
        string baseSlug = Slugify(name);

        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "org";

        string candidate = baseSlug;
        int suffix = 2;

        while (await _context.Organizations.AnyAsync(o => o.Slug == candidate))
        {
            candidate = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return candidate;
    }

    private static string Slugify(string value)
    {
        string lower = value.Trim().ToLowerInvariant();
        char[] chars = lower.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray();
        string slug = new string(chars);

        while (slug.Contains("--")) slug = slug.Replace("--", "-");

        slug = slug.Trim('-');

        return slug.Length > 90 ? slug[..90].Trim('-') : slug;
    }

    private static IEnumerable<TicketStatus> BuildDefaultStatuses(Guid organizationId) => new[]
    {
        new TicketStatus { OrganizationId = organizationId, Name = "Nouveau", Color = "var(--accent)", Order = 0, IsDefault = true, IsClosed = false },
        new TicketStatus { OrganizationId = organizationId, Name = "En cours", Color = "var(--orange)", Order = 1, IsDefault = false, IsClosed = false },
        new TicketStatus { OrganizationId = organizationId, Name = "En test", Color = "var(--cyan)", Order = 2, IsDefault = false, IsClosed = false },
        new TicketStatus { OrganizationId = organizationId, Name = "Résolu", Color = "var(--green)", Order = 3, IsDefault = false, IsClosed = true },
        new TicketStatus { OrganizationId = organizationId, Name = "Fermé", Color = "var(--muted2)", Order = 4, IsDefault = false, IsClosed = true }
    };

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _context.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
    }
}
