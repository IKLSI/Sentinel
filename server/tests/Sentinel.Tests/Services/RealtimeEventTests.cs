using System.Text.Json;
using FluentAssertions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Realtime;

namespace Sentinel.Tests.Services;

public class RealtimeEventTests
{
    [Fact]
    public void AffectedProjects_IgnoreLesProjetsAbsentsEtLesDoublons()
    {
        Guid project = Guid.NewGuid();

        RealtimeEvent.AffectedProjects(project, null, project).Should().Equal(project);
    }

    [Fact]
    public void AffectedProjects_SansProjet_RenvoieUneListeVide()
    {
        RealtimeEvent.AffectedProjects((Guid?)null).Should().BeEmpty();
    }

    [Fact]
    public void Serialisation_ExposeLesProjetsSousLeNomAttenduParLeFront()
    {
        Guid project = Guid.NewGuid();

        string json = JsonSerializer.Serialize(
            new RealtimeEvent(RealtimeResources.Ticket, project, [project]),
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        json.Should().Contain($"\"projectIds\":[\"{project}\"]");
    }
}
