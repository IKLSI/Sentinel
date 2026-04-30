using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Auth;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class AuthService
{
    private readonly SentinelContext _context;
    private readonly TokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(SentinelContext context, TokenService tokenService, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
        _logger = logger;
    }

    private int RefreshTokenExpirationDays =>
        int.TryParse(_configuration["Jwt:RefreshTokenExpirationDays"], out int days) && days > 0 ? days : 30;

    public async Task<PasswordResetToken?> CreatePasswordResetTokenAsync(string email)
    {
        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLower() && u.IsActive);

        if (user == null) return null;

        await _context.PasswordResetTokens
            .Where(t => t.Email == email.ToLower() && !t.IsUsed)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsUsed, true));

        string rawToken = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48));

        PasswordResetToken resetToken = new PasswordResetToken
        {
            Email = email.ToLower(),
            Token = rawToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync();

        return resetToken;
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        PasswordResetToken? resetToken = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

        if (resetToken == null) return false;

        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == resetToken.Email && u.IsActive);

        if (user == null) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        resetToken.IsUsed = true;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Mot de passe réinitialisé pour {Email}", user.Email);
        return true;
    }

    public async Task<LoginResponse?> LoginAsync(string email, string password)
    {
        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email.ToLower() && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return null;
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
                Theme = user.Theme
            }
        };
    }

    public async Task<LoginResponse?> RefreshTokenAsync(string refreshToken)
    {
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
                Theme = user.Theme
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
        await _context.SaveChangesAsync();
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _context.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
    }
}
