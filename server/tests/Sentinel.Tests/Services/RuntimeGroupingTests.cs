using FluentAssertions;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Tests.Services;

public class RuntimeGroupingTests
{
    private static Runtime Runtime(string name, string version, bool? isEol = null, DateTime? eolDate = null)
        => new Runtime { Name = name, Version = version, IsEol = isEol, EolDate = eolDate };

    [Fact]
    public void ByName_MergesDeclarationsOfTheSameRuntime()
    {
        Runtime[] runtimes =
        [
            Runtime("Node.js", "20.11.0", isEol: false),
            Runtime("Node.js", "18.20.4", isEol: true),
            Runtime("Python", "3.12.1", isEol: false)
        ];

        IReadOnlyList<RuntimeGroup> groups = RuntimeGrouping.ByName(runtimes);

        groups.Should().HaveCount(2);
        groups.Select(group => group.MostAtRisk.Name).Should().ContainInOrder("Node.js", "Python");
    }

    [Fact]
    public void ByName_KeepsTheMostAtRiskDeclarationAsRepresentative()
    {
        Runtime[] runtimes =
        [
            Runtime("Node.js", "20.11.0", isEol: false),
            Runtime("Node.js", "18.20.4", isEol: true)
        ];

        RuntimeGroup group = RuntimeGrouping.ByName(runtimes).Single();

        group.MostAtRisk.Version.Should().Be("18.20.4");
        group.MostAtRisk.IsEol.Should().BeTrue();
    }

    [Fact]
    public void ByName_PrefersTheEarliestEndOfLifeDateWhenNothingIsExpiredYet()
    {
        Runtime[] runtimes =
        [
            Runtime("Node.js", "22.0.0", eolDate: new DateTime(2027, 4, 30, 0, 0, 0, DateTimeKind.Utc)),
            Runtime("Node.js", "20.11.0", eolDate: new DateTime(2026, 4, 30, 0, 0, 0, DateTimeKind.Utc))
        ];

        RuntimeGrouping.ByName(runtimes).Single().MostAtRisk.Version.Should().Be("20.11.0");
    }

    [Fact]
    public void ByName_RanksAssessedRuntimesAheadOfUnassessedOnes()
    {
        Runtime[] runtimes =
        [
            Runtime("Node.js", "22.0.0"),
            Runtime("Node.js", "20.11.0", isEol: false)
        ];

        RuntimeGrouping.ByName(runtimes).Single().MostAtRisk.Version.Should().Be("20.11.0");
    }

    [Fact]
    public void ByName_ListsEveryDeclaredVersionSortedAndDeduplicated()
    {
        Runtime[] runtimes =
        [
            Runtime("Node.js", "20.11.0"),
            Runtime("Node.js", "18.20.4"),
            Runtime("Node.js", "20.11.0"),
            Runtime("node.js", "22.0.0")
        ];

        RuntimeGrouping.ByName(runtimes).Single().Versions
            .Should().ContainInOrder("18.20.4", "20.11.0", "22.0.0")
            .And.HaveCount(3);
    }
}
