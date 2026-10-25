using FluentAssertions;
using Sentinel.Application.Dashboard.GetStats;

namespace Sentinel.Tests.Services.Dashboard;

public class ActivityGrouperTests
{
    private static readonly DateTime Now = new(2026, 10, 25, 12, 0, 0, DateTimeKind.Utc);

    private static ActivityItemDto Item(string type, string? projectId, int minutesAgo) => new()
    {
        Type = type,
        ProjectId = projectId,
        ProjectName = projectId is null ? null : $"Projet {projectId}",
        Timestamp = Now.AddMinutes(-minutesAgo),
        TicketId = Guid.NewGuid().ToString(),
        Reference = "TKT-000001",
    };

    [Fact]
    public void Group_TicketsConsecutifsDuMemeProjet_SontFusionnes()
    {
        List<ActivityItemDto> result = ActivityGrouper.Group(
            [Item("created", "a", 1), Item("created", "a", 2), Item("created", "a", 3)]);

        ActivityItemDto merged = result.Should().ContainSingle().Subject;
        merged.Count.Should().Be(3);
        merged.Timestamp.Should().Be(Now.AddMinutes(-1));
        merged.TicketId.Should().BeNull();
        merged.Reference.Should().BeNull();
        merged.ProjectId.Should().Be("a");
        merged.Detail.Should().Be("Projet a");
    }

    [Fact]
    public void Group_ElementIsole_ResteInchange()
    {
        ActivityItemDto single = Item("created", "a", 1);

        ActivityGrouper.Group([single]).Should().ContainSingle().Which.Should().BeSameAs(single);
    }

    [Fact]
    public void Group_ProjetOuTypeDifferent_InterrompLeGroupe()
    {
        List<ActivityItemDto> result = ActivityGrouper.Group(
            [Item("created", "a", 1), Item("created", "b", 2), Item("resolved", "b", 3), Item("created", "a", 4)]);

        result.Should().HaveCount(4);
    }

    [Fact]
    public void Group_SansProjet_NeFusionnePas()
    {
        ActivityGrouper.Group([Item("created", null, 1), Item("created", null, 2)]).Should().HaveCount(2);
    }

    [Fact]
    public void Group_Vulnerabilites_NeSontJamaisFusionnees()
    {
        ActivityGrouper.Group([Item("vuln", "a", 1), Item("vuln", "a", 2)]).Should().HaveCount(2);
    }
}
