using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Sentinel.Infrastructure.Data;

public class SentinelContextDesignTimeFactory : IDesignTimeDbContextFactory<SentinelContext>
{
    public SentinelContext CreateDbContext(string[] args)
    {
        DbContextOptionsBuilder<SentinelContext> optionsBuilder = new DbContextOptionsBuilder<SentinelContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=sentinel_design;Username=postgres;Password=postgres");
        return new SentinelContext(optionsBuilder.Options);
    }
}
