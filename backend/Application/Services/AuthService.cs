using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.DTOs.Auth;
using TMAflow.Domain.Models;

namespace TMAflow.Application.Services;

public class AuthService
{
    private readonly TMAflowContext _context;
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(TMAflowContext context, TokenService tokenService, ILogger<AuthService> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _logger = logger;
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
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
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
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

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
