using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Tests.Services;

public class TicketFilterParserTests
{
    [Fact]
    public void Validate_QuandUneValeurNAppartientPasALEnumeration_RetourneUneErreur()
    {
        TicketFilterRequest request = new() { Priority = ["high", "urgent"] };

        Result result = TicketFilterParser.Validate(request);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCodes.TicketFilterValueInvalid);
    }

    [Fact]
    public void Validate_QuandLeNombreDeValeursDepasseLaLimite_RetourneUneErreur()
    {
        TicketFilterRequest request = new()
        {
            AssignedTo = [.. Enumerable.Range(0, TicketFilterRequest.MaxValuesPerField + 1)
                .Select(_ => Guid.NewGuid().ToString())]
        };

        Result result = TicketFilterParser.Validate(request);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCodes.TicketFilterTooManyValues);
    }

    [Fact]
    public void Validate_QuandUneReferenceNEstPasUnIdentifiant_RetourneUneErreur()
    {
        TicketFilterRequest request = new() { Project = ["sentinel-api"] };

        Result result = TicketFilterParser.Validate(request);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCodes.TicketFilterValueInvalid);
    }

    [Fact]
    public void Validate_QuandLaRechercheDepasseLaLimite_RetourneUneErreur()
    {
        TicketFilterRequest request = new() { Search = new string('a', TicketFilterRequest.SearchMaxLength + 1) };

        Result result = TicketFilterParser.Validate(request);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCodes.TicketSearchTooLong);
    }

    [Fact]
    public void Build_AvecPlusieursValeurs_DedupliqueEtConserveLOrdre()
    {
        TicketFilterRequest request = new() { Priority = ["high", "critical", "high"], Status = ["closed"] };

        TicketFilter filter = TicketFilterParser.Build(request);

        filter.Priority.Values.Should().Equal(TicketPriority.High, TicketPriority.Critical);
        filter.Status.Values.Should().Equal(TicketStatus.Closed);
    }

    [Fact]
    public void Build_QuandLaValeurNonAffecteeEstDemandee_ActiveLInclusionDesTicketsSansReference()
    {
        Guid assigneeId = Guid.NewGuid();
        TicketFilterRequest request = new() { AssignedTo = [TicketFilterParser.UnsetValue, assigneeId.ToString()] };

        TicketFilter filter = TicketFilterParser.Build(request);

        filter.AssignedTo.IncludeUnset.Should().BeTrue();
        filter.AssignedTo.Ids.Should().Equal(assigneeId);
    }

    [Fact]
    public void Build_SansAucunFiltre_RendUnFiltreVide()
    {
        TicketFilter filter = TicketFilterParser.Build(new TicketFilterRequest());

        filter.Priority.IsEmpty.Should().BeTrue();
        filter.Status.IsEmpty.Should().BeTrue();
        filter.Type.IsEmpty.Should().BeTrue();
        filter.AssignedTo.IsEmpty.Should().BeTrue();
        filter.Project.IsEmpty.Should().BeTrue();
        filter.Search.Should().BeNull();
    }
}
