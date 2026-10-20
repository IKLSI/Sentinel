using FluentAssertions;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services.Dashboard;

public class NextActionResolverTests
{
    private static readonly DateOnly Today = new(2026, 10, 19);

    [Fact]
    public void Resolve_AnalyseEnEchec_DemandeDeLaCorriger()
    {
        Project project = new ProjectGraphBuilder()
            .WithScanError(ErrorCodes.ScanNoAccessibleFiles)
            .WithDependency("next")
            .WithVulnerability("next", "CVE-1", isKnownExploited: true)
            .Build();

        NextActionResolver.Resolve(project, [], []).Should().BeEquivalentTo(new NextActionDto
        {
            Kind = NextActionKind.FixScan,
        });
    }

    [Fact]
    public void Resolve_DonneesDeVulnerabilitesIncompletes_NeSontPasUneErreurDAnalyse()
    {
        Project project = new ProjectGraphBuilder()
            .WithScanError(ErrorCodes.ScanVulnerabilityDataIncomplete)
            .Build();

        NextActionResolver.HasScanError(project).Should().BeFalse();
    }

    [Fact]
    public void Resolve_FailleSerieuse_ProposeLaVersionCorrigee()
    {
        Project project = new ProjectGraphBuilder()
            .WithDependency("next")
            .WithVulnerability("next", "CVE-1", fixedVersion: "15.2.3", isKnownExploited: true)
            .Build();

        NextActionDto? action = NextActionResolver.Resolve(project, [], []);

        action!.Kind.Should().Be(NextActionKind.UpdateDependency);
        action.Target.Should().Be("next");
        action.Version.Should().Be("15.2.3");
    }

    [Fact]
    public void Resolve_TicketCritiqueSansResponsable_ProposeDeLAssigner()
    {
        Project project = new ProjectGraphBuilder().Build();
        OpenTicketRow ticket = new OpenTicketRow(Guid.NewGuid(), 48, project.Id, TicketPriority.Critical, false,
            DateTime.UtcNow);

        NextActionDto? action = NextActionResolver.Resolve(project, [ticket], []);

        action!.Kind.Should().Be(NextActionKind.AssignTicket);
        action.TicketReference.Should().Be("TKT-000048");
    }

    [Fact]
    public void Resolve_RuntimeBientotEnFinDeVie_ProposeDePlanifierLaMigration()
    {
        Project project = new ProjectGraphBuilder()
            .WithRuntime(".NET", "8", Today.AddDays(22).ToDateTime(TimeOnly.MinValue))
            .Build();

        IReadOnlyList<RuntimeDeadline> deadlines = RuntimeDeadlineCalculator.Compute(
            [.. project.Runtimes.Select(runtime => new DashboardRuntimeRow(project.Id, runtime.Name, runtime.Version,
                runtime.EolDate, runtime.IsEol, runtime.IsMinimumConstraint))], Today);

        NextActionDto? action = NextActionResolver.Resolve(project, [], deadlines);

        action!.Kind.Should().Be(NextActionKind.PlanRuntimeMigration);
        action.Target.Should().Be(".NET");
        action.Version.Should().Be("8");
    }

    [Fact]
    public void Resolve_ProjetSain_NeProposeRien()
    {
        Project project = new ProjectGraphBuilder().WithDependency("react").Build();

        NextActionResolver.Resolve(project, [], []).Should().BeNull();
    }
}
