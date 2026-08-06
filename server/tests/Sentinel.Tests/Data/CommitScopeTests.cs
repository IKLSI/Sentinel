using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Entities;
using Sentinel.Infrastructure.Data;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Data;

public class CommitScopeTests
{
    [Fact]
    public void Begin_SurFournisseurRelationnelAvecReessais_NOuvrePasDeTransactionUtilisateur()
    {
        using SentinelContext context = CreateResilientNpgsqlContext();

        context.Database.IsRelational().Should().BeTrue();
        context.Database.CreateExecutionStrategy().RetriesOnFailure.Should().BeTrue();

        CommitScopeFactory manager = new CommitScopeFactory(context);

        using ICommitScope commitScope = manager.Begin();

        context.Database.CurrentTransaction.Should().BeNull();
    }

    [Fact]
    public async Task CommitAsync_AppeleDeuxFois_Echoue()
    {
        using TestScope scope = new TestScope();
        CommitScopeFactory manager = new CommitScopeFactory(scope.Context);

        using ICommitScope commitScope = manager.Begin();

        await commitScope.CommitAsync(CancellationToken.None);

        Func<Task> secondCommit = () => commitScope.CommitAsync(CancellationToken.None);

        await secondCommit.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public void Dispose_SansCommit_AbandonneLesModificationsEnAttente()
    {
        using TestScope scope = new TestScope();
        CommitScopeFactory manager = new CommitScopeFactory(scope.Context);

        using (manager.Begin())
        {
            scope.Context.Organizations.Add(scope.NewOrganization());
        }

        scope.Context.ChangeTracker.Entries<Organization>().Should().BeEmpty();
    }

    private static SentinelContext CreateResilientNpgsqlContext()
    {
        DbContextOptions<SentinelContext> options = new DbContextOptionsBuilder<SentinelContext>()
            .UseNpgsql(
                "Host=localhost;Database=sentinel_non_connecte;Username=sentinel;Password=sentinel",
                npgsql => npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null))
            .Options;

        return new SentinelContext(options);
    }
}
