using FluentAssertions;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services.Dashboard;

public class RuntimeDeadlineCalculatorTests
{
    private static readonly DateOnly Today = new(2026, 10, 19);

    [Fact]
    public void Compute_MemeRuntimeSurPlusieursProjets_EstRegroupeEtTrieParEcheance()
    {
        DateTime dotnetEol = Today.AddDays(22).ToDateTime(TimeOnly.MinValue);

        Project termetis = new ProjectGraphBuilder("Termetis").WithRuntime(".NET", "8", dotnetEol).Build();
        Project sentinel = new ProjectGraphBuilder("Sentinel")
            .WithRuntime(".NET", "8", dotnetEol)
            .WithRuntime("Node", "22", Today.AddDays(193).ToDateTime(TimeOnly.MinValue))
            .Build();

        IReadOnlyList<RuntimeDeadline> deadlines = RuntimeDeadlineCalculator.Compute([termetis, sentinel], Today);

        deadlines.Should().HaveCount(2);
        deadlines[0].Runtime.Should().Be(".NET");
        deadlines[0].DaysLeft.Should().Be(22);
        deadlines[0].ProjectIds.Should().BeEquivalentTo([termetis.Id, sentinel.Id]);
        deadlines[1].Runtime.Should().Be("Node");
    }

    [Fact]
    public void Compute_RuntimeDejaEnFinDeVieSansDate_EstEchuAujourdHui()
    {
        Project project = new ProjectGraphBuilder().WithRuntime("Python", "3.7", null, isEol: true).Build();

        RuntimeDeadline deadline = RuntimeDeadlineCalculator.Compute([project], Today).Should().ContainSingle().Subject;

        deadline.DaysLeft.Should().Be(0);
    }

    [Fact]
    public void Compute_RuntimeSansCycleDeVieConnu_EstIgnore()
    {
        Project project = new ProjectGraphBuilder().WithRuntime("Go", "1.23", null).Build();

        RuntimeDeadlineCalculator.Compute([project], Today).Should().BeEmpty();
    }
}
