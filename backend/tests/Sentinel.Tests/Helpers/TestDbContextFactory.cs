using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions;
using Sentinel.Infrastructure.Data;

namespace Sentinel.Tests.Helpers;

public static class TestDbContextFactory
{
    public static SentinelContext CreateInMemory(string? name = null)
        => new(BuildOptions(name));

    public static SentinelContext CreateInMemory(ITenantContext tenant, string? name = null)
        => new(BuildOptions(name), tenant);

    private static DbContextOptions<SentinelContext> BuildOptions(string? name) =>
        new DbContextOptionsBuilder<SentinelContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString())
            .Options;
}
