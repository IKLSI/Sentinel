using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Tests.Helpers;

public static class TestDbContextFactory
{
    public static SentinelContext CreateInMemory(string? name = null)
    {
        DbContextOptions<SentinelContext> options = new DbContextOptionsBuilder<SentinelContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString())
            .Options;
        return new SentinelContext(options);
    }
}
