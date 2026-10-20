using FluentAssertions;
using Sentinel.Application.Dashboard.GetStats;
using Sentinel.Domain.Repositories;

namespace Sentinel.Tests.Services.Dashboard;

public class ScoreHistoryBuilderTests
{
    private static readonly DateOnly Today = new(2026, 10, 19);

    [Fact]
    public void Build_JoursSansScan_ReprennentLeDernierScoreConnu()
    {
        Guid tily = Guid.NewGuid();
        Guid sentinel = Guid.NewGuid();

        ScoreSnapshotRow[] snapshots =
        [
            new(tily, Today.AddDays(-10), 80),
            new(sentinel, Today.AddDays(-2), 90),
            new(tily, Today, 70),
        ];

        List<ScorePointDto> history = ScoreHistoryBuilder.Build(snapshots, Today.AddDays(-3), Today);

        history.Select(p => p.Score).Should().Equal(80, 85, 85, 80);
        history[0].Date.Should().Be("2026-10-16");
        history[^1].Date.Should().Be("2026-10-19");
    }

    [Fact]
    public void Build_AvantLePremierInstantane_LePointEstVide()
    {
        ScoreSnapshotRow[] snapshots = [new(Guid.NewGuid(), Today, 75)];

        List<ScorePointDto> history = ScoreHistoryBuilder.Build(snapshots, Today.AddDays(-1), Today);

        history.Select(p => p.Score).Should().Equal(null, 75);
    }

    [Fact]
    public void Delta_CompareLePremierEtLeDernierPointConnus()
    {
        List<ScorePointDto> history =
        [
            new() { Date = "2026-10-17", Score = null },
            new() { Date = "2026-10-18", Score = 79 },
            new() { Date = "2026-10-19", Score = 84 },
        ];

        ScoreHistoryBuilder.Delta(history).Should().Be(5);
    }

    [Fact]
    public void Delta_UnSeulPointConnu_EstIndisponible()
    {
        List<ScorePointDto> history = [new() { Date = "2026-10-19", Score = 84 }];

        ScoreHistoryBuilder.Delta(history).Should().BeNull();
    }

    [Fact]
    public void ScoresAt_RetourneLeScoreEnVigueurAuJourDemande()
    {
        Guid project = Guid.NewGuid();
        ScoreSnapshotRow[] snapshots = [new(project, Today.AddDays(-40), 60), new(project, Today.AddDays(-5), 75)];

        IReadOnlyDictionary<Guid, int> scores = ScoreHistoryBuilder.ScoresAt(snapshots, Today.AddDays(-29));

        scores.Should().ContainKey(project).WhoseValue.Should().Be(60);
    }
}
