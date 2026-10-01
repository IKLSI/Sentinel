using FluentAssertions;
using Sentinel.Application.Tickets.CreateFromFinding;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class FindingTicketDraftBuilderTests
{
    private readonly FindingTicketDraftBuilder _builder = new(TestLocalizer.Create(), LanguageValues.En);

    [Theory]
    [InlineData(VulnerabilitySeverity.Critical, TicketPriority.Critical)]
    [InlineData(VulnerabilitySeverity.High, TicketPriority.High)]
    [InlineData(VulnerabilitySeverity.Medium, TicketPriority.Medium)]
    [InlineData(VulnerabilitySeverity.Low, TicketPriority.Low)]
    public void ForVulnerability_AligneLaPrioriteSurLaSeverite(VulnerabilitySeverity severity,
        TicketPriority expected)
    {
        Dependency dependency = NewDependency("1.0.0", "1.0.0");
        Vulnerability vulnerability = new()
        {
            CveId = "GHSA-1",
            CveAlias = "CVE-2026-1234",
            PackageName = dependency.Name,
            Severity = severity,
            CvssScore = 9.8m,
            FixedVersion = "1.0.1",
            Description = "Prototype pollution"
        };

        FindingTicketDraft draft = _builder.ForVulnerability(dependency, vulnerability);

        draft.Priority.Should().Be(expected);
        draft.Type.Should().Be(TicketType.Security);
        draft.Title.Should().Be("Fix CVE-2026-1234 in lodash 1.0.0");
        draft.Description.Should().Contain("1.0.1").And.Contain("9.8").And.Contain("Prototype pollution");
    }

    [Theory]
    [InlineData("1.0.0", "2.0.0", TicketPriority.Medium)]
    [InlineData("1.0.0", "1.4.0", TicketPriority.Low)]
    public void ForDependency_PrioriseLesMontesMajeures(string current, string latest, TicketPriority expected)
    {
        FindingTicketDraft draft = _builder.ForDependency(NewDependency(current, latest));

        draft.Priority.Should().Be(expected);
        draft.Type.Should().Be(TicketType.Maintenance);
        draft.Title.Should().Be($"Update lodash {current} → {latest}");
    }

    [Fact]
    public void ForDependency_QuandLePaquetEstEnFinDeVie_PrioriteHaute()
    {
        Dependency dependency = NewDependency("1.0.0", null);
        dependency.Status = DependencyStatus.EOL;

        FindingTicketDraft draft = _builder.ForDependency(dependency);

        draft.Priority.Should().Be(TicketPriority.High);
        draft.Title.Should().Be("Replace end-of-life package lodash 1.0.0");
    }

    [Fact]
    public void ForRuntime_ListeLesVersionsEtLaDateDeFinDeVie()
    {
        Runtime runtime = new() { Name = "nodejs", Version = "16", IsEol = true, EolDate = new DateTime(2023, 9, 11) };

        FindingTicketDraft draft = _builder.ForRuntime(new RuntimeGroup(runtime, ["16", "18"]));

        draft.Priority.Should().Be(TicketPriority.High);
        draft.Type.Should().Be(TicketType.Maintenance);
        draft.Description.Should().Contain("16, 18").And.Contain("2023-09-11");
    }

    private static Dependency NewDependency(string current, string? latest) => new()
    {
        Name = "lodash",
        Ecosystem = DependencyEcosystem.Npm,
        CurrentVersion = current,
        LatestVersion = latest
    };
}
