using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Dashboard.GetStats;

public static class ScoreHistoryBuilder
{
    public static List<ScorePointDto> Build(IReadOnlyList<ScoreSnapshotRow> snapshots, DateOnly windowStart,
        DateOnly today)
    {
        Dictionary<Guid, List<ScoreSnapshotRow>> byProject = GroupByProject(snapshots);

        return Enumerable
            .Range(0, today.DayNumber - windowStart.DayNumber + 1)
            .Select(offset => windowStart.AddDays(offset))
            .Select(day =>
            {
                List<int> scores = byProject.Values
                    .Select(history => LatestAt(history, day))
                    .OfType<int>()
                    .ToList();

                return new ScorePointDto
                {
                    Date = day.ToString("yyyy-MM-dd"),
                    Score = scores.Count > 0 ? (int)Math.Round(scores.Average()) : null,
                };
            })
            .ToList();
    }

    public static IReadOnlyDictionary<Guid, int> ScoresAt(IReadOnlyList<ScoreSnapshotRow> snapshots, DateOnly day) =>
        GroupByProject(snapshots)
            .Select(entry => (ProjectId: entry.Key, Score: LatestAt(entry.Value, day)))
            .Where(entry => entry.Score != null)
            .ToDictionary(entry => entry.ProjectId, entry => entry.Score!.Value);

    public static int? Delta(IReadOnlyList<ScorePointDto> history)
    {
        List<int> scores = history.Select(point => point.Score).OfType<int>().ToList();

        return scores.Count > 1 ? scores[^1] - scores[0] : null;
    }

    private static Dictionary<Guid, List<ScoreSnapshotRow>> GroupByProject(
        IReadOnlyList<ScoreSnapshotRow> snapshots) =>
        snapshots
            .GroupBy(snapshot => snapshot.ProjectId)
            .ToDictionary(group => group.Key, group => group.OrderBy(snapshot => snapshot.Day).ToList());

    private static int? LatestAt(List<ScoreSnapshotRow> history, DateOnly day) =>
        history.LastOrDefault(snapshot => snapshot.Day <= day)?.Score;
}
