using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TMAflow.Domain.Models;

namespace TMAflow.Infrastructure.Data;

public class DataSeeder
{
    private readonly TMAflowContext _context;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(TMAflowContext context, ILogger<DataSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        await _context.Database.MigrateAsync();

        Organization? organization = await _context.Organizations.FirstOrDefaultAsync();

        if (organization == null)
        {
            _logger.LogInformation("Initialisation des données de base...");

            organization = new Organization
            {
                Id = Guid.NewGuid(),
                Name = "TMAflow",
                Slug = "tmaflow",
                Timezone = "Europe/Paris",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Organizations.AddAsync(organization);

            User adminUser = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Email = "admin@tmaflow.io",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("TMAflow2026!"),
                FirstName = "Admin",
                LastName = "TMAflow",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(adminUser);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Données de base initialisées. Admin: admin@tmaflow.io");
        }
    }
}
