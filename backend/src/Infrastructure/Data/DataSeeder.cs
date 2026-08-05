using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Infrastructure.Data;

public class DataSeeder
{
    private readonly SentinelContext _context;
    private readonly ISystemScope _systemScope;

    public DataSeeder(SentinelContext context, ISystemScope systemScope)
    {
        _context = context;
        _systemScope = systemScope;
    }

    public async Task SeedAsync()
    {
        using IDisposable elevation = _systemScope.Enter();

        if (await _context.Organizations.AnyAsync())
            return;

        var now = DateTime.UtcNow;

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Sentinel",
            Slug = "sentinel",
            PlanTier = PlanTier.Business,
            ScanCountPeriodStart = now,
            CreatedAt = now
        };

        await _context.Organizations.AddAsync(org);

        var hash = BCrypt.Net.BCrypt.HashPassword("Sentinel2026!");

        var admin = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Email = "admin@sentinel.io",
            PasswordHash = hash,
            FirstName = "Admin",
            LastName = "Sentinel",
            Role = UserRole.Admin,
            AccessStatus = UserAccessStatus.Active,
            IsEmailVerified = true,
            CreatedAt = now,
            Theme = ThemeType.Light
        };

        await _context.Users.AddAsync(admin);

        await _context.SaveChangesAsync();
    }
}
