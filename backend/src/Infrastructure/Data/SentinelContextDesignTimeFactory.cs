using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Sentinel.Infrastructure.Data;

public class SentinelContextDesignTimeFactory : IDesignTimeDbContextFactory<SentinelContext>
{
    public SentinelContext CreateDbContext(string[] args)
    {
        string connection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Host=localhost;Database=sentinel_design;Username=postgres;Password=postgres";

        DbContextOptionsBuilder<SentinelContext> optionsBuilder = new DbContextOptionsBuilder<SentinelContext>();
        optionsBuilder.UseNpgsql(connection);
        return new SentinelContext(optionsBuilder.Options);
    }
}
