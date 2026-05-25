using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;

namespace Sentinel.Infrastructure.Data;

public class DataSeeder
{
    private readonly SentinelContext _context;
    private readonly ILogger<DataSeeder> _logger;
    private readonly ISystemScope _systemScope;

    public DataSeeder(SentinelContext context, ILogger<DataSeeder> logger, ISystemScope systemScope)
    {
        _context = context;
        _logger = logger;
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
            Timezone = "Europe/Paris",
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
            IsActive = true,
            IsEmailVerified = true,
            CreatedAt = now,
            Theme = "dark"
        };

        await _context.Users.AddAsync(admin);

        var statusNew = new TicketStatus { Id = Guid.NewGuid(), OrganizationId = org.Id, Name = "Nouveau", Color = "var(--accent)", Order = 0, IsDefault = true, IsClosed = false };
        var statusInProgress = new TicketStatus { Id = Guid.NewGuid(), OrganizationId = org.Id, Name = "En cours", Color = "var(--orange)", Order = 1, IsDefault = false, IsClosed = false };
        var statusTesting = new TicketStatus { Id = Guid.NewGuid(), OrganizationId = org.Id, Name = "En test", Color = "var(--cyan)", Order = 2, IsDefault = false, IsClosed = false };
        var statusResolved = new TicketStatus { Id = Guid.NewGuid(), OrganizationId = org.Id, Name = "Résolu", Color = "var(--green)", Order = 3, IsDefault = false, IsClosed = true };
        var statusClosed = new TicketStatus { Id = Guid.NewGuid(), OrganizationId = org.Id, Name = "Fermé", Color = "var(--muted2)", Order = 4, IsDefault = false, IsClosed = true };

        await _context.TicketStatuses.AddRangeAsync(statusNew, statusInProgress, statusTesting, statusResolved, statusClosed);

        await _context.SaveChangesAsync();
    }
}
