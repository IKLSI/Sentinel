using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.DTOs.ApiKeys;
using Sentinel.Domain.Models;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Application.Services;

public class ApiKeyService
{
    private const string Prefix = "sen_";
    private readonly SentinelContext _context;

    public ApiKeyService(SentinelContext context)
    {
        _context = context;
    }

    public async Task<CreatedApiKeyDto> CreateAsync(Guid organizationId, Guid userId, CreateApiKeyDto dto)
    {
        byte[] rawBytes = RandomNumberGenerator.GetBytes(32);
        string rawKey = Prefix + Convert.ToHexString(rawBytes).ToLowerInvariant();
        string keyHash = HashKey(rawKey);
        string prefix = rawKey[..Math.Min(12, rawKey.Length)];

        ApiKey apiKey = new ApiKey
        {
            OrganizationId = organizationId,
            CreatedById = userId,
            Name = dto.Name.Trim(),
            KeyHash = keyHash,
            Prefix = prefix,
            ExpiresAt = dto.ExpiresAt.HasValue ? DateTime.SpecifyKind(dto.ExpiresAt.Value, DateTimeKind.Utc) : null,
        };

        _context.ApiKeys.Add(apiKey);
        await _context.SaveChangesAsync();

        return new CreatedApiKeyDto
        {
            Id = apiKey.Id,
            Name = apiKey.Name,
            Prefix = apiKey.Prefix,
            Key = rawKey,
            ExpiresAt = apiKey.ExpiresAt,
            CreatedAt = apiKey.CreatedAt,
        };
    }

    public async Task<List<ApiKeyDto>> ListAsync(Guid organizationId)
    {
        return await _context.ApiKeys
            .Where(k => k.OrganizationId == organizationId && !k.IsRevoked)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyDto
            {
                Id = k.Id,
                Name = k.Name,
                Prefix = k.Prefix,
                ExpiresAt = k.ExpiresAt,
                LastUsedAt = k.LastUsedAt,
                CreatedAt = k.CreatedAt,
                CreatedByName = k.CreatedBy.FullName,
            })
            .ToListAsync();
    }

    public async Task<bool> RevokeAsync(Guid organizationId, Guid keyId)
    {
        ApiKey? key = await _context.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == keyId && k.OrganizationId == organizationId && !k.IsRevoked);

        if (key == null) return false;

        key.IsRevoked = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<(ApiKey key, User user)?> ValidateAsync(string rawKey)
    {
        string keyHash = HashKey(rawKey);

        ApiKey? key = await _context.ApiKeys
            .IgnoreQueryFilters()
            .Include(k => k.CreatedBy)
            .FirstOrDefaultAsync(k => k.KeyHash == keyHash && !k.IsRevoked);

        if (key == null) return null;
        if (key.ExpiresAt.HasValue && key.ExpiresAt.Value < DateTime.UtcNow) return null;

        User user = key.CreatedBy;
        if (!user.IsActive) return null;

        key.LastUsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return (key, user);
    }

    public async Task RevokeAllForUserAsync(Guid userId)
    {
        List<ApiKey> keys = await _context.ApiKeys
            .Where(k => k.CreatedById == userId && !k.IsRevoked)
            .ToListAsync();

        foreach (ApiKey key in keys)
            key.IsRevoked = true;

        await _context.SaveChangesAsync();
    }

    private static string HashKey(string rawKey)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
