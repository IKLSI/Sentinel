using FluentAssertions;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Repositories;

namespace Sentinel.Tests.Services.Dashboard;

public class RuntimeDeadlineCalculatorTests
{
    private static readonly DateOnly Today = new(2026, 10, 19);

    private static DashboardRuntimeRow Runtime(Guid projectId, string name, string version, DateTime? eolDate,
        bool? isEol = null, bool isMinimumConstraint = false) =>
        new(projectId, name, version, eolDate, isEol, isMinimumConstraint);

    [Fact]
    public void Compute_MemeRuntimeSurPlusieursProjets_EstRegroupeEtTrieParEcheance()
    {
        DateTime dotnetEol = Today.AddDays(22).ToDateTime(TimeOnly.MinValue);
        Guid termetis = Guid.NewGuid();
        Guid sentinel = Guid.NewGuid();

        IReadOnlyList<RuntimeDeadline> deadlines = RuntimeDeadlineCalculator.Compute(
        [
            Runtime(termetis, ".NET", "8", dotnetEol),
            Runtime(sentinel, ".NET", "8", dotnetEol),
            Runtime(sentinel, "Node", "22", Today.AddDays(193).ToDateTime(TimeOnly.MinValue)),
        ], Today);

        deadlines.Should().HaveCount(2);
        deadlines[0].Runtime.Should().Be(".NET");
        deadlines[0].DaysLeft.Should().Be(22);
        deadlines[0].ProjectIds.Should().BeEquivalentTo([termetis, sentinel]);
        deadlines[1].Runtime.Should().Be("Node");
    }

    [Fact]
    public void Compute_RuntimeDejaEnFinDeVieSansDate_EstEchuAujourdHui()
    {
        RuntimeDeadline deadline = RuntimeDeadlineCalculator
            .Compute([Runtime(Guid.NewGuid(), "Python", "3.7", null, isEol: true)], Today)
            .Should().ContainSingle().Subject;

        deadline.DaysLeft.Should().Be(0);
    }

    [Fact]
    public void Compute_RuntimeSansCycleDeVieConnu_EstIgnore()
    {
        RuntimeDeadlineCalculator.Compute([Runtime(Guid.NewGuid(), "Go", "1.23", null)], Today).Should().BeEmpty();
    }

    [Fact]
    public void Compute_VersionMinimumDeclaree_EstIgnoree()
    {
        DashboardRuntimeRow minimum = Runtime(Guid.NewGuid(), "Node.js", "14",
            Today.AddDays(-400).ToDateTime(TimeOnly.MinValue), isEol: true, isMinimumConstraint: true);

        RuntimeDeadlineCalculator.Compute([minimum], Today).Should().BeEmpty();
    }
}
