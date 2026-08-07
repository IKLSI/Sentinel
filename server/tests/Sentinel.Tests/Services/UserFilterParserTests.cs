using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Users;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Tests.Services;

public class UserFilterParserTests
{
    [Fact]
    public void Validate_QuandUnRoleNAppartientPasALEnumeration_RetourneUneErreur()
    {
        UserFilterRequest request = new() { Role = ["Admin", "Owner"] };

        Result result = UserFilterParser.Validate(request);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCodes.UserFilterValueInvalid);
    }

    [Fact]
    public void Validate_QuandUnStatutNAppartientPasALEnumeration_RetourneUneErreur()
    {
        UserFilterRequest request = new() { Status = ["Archived"] };

        Result result = UserFilterParser.Validate(request);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCodes.UserFilterValueInvalid);
    }

    [Fact]
    public void Validate_QuandLeNombreDeValeursDepasseLaLimite_RetourneUneErreur()
    {
        UserFilterRequest request = new()
        {
            Role = [.. Enumerable.Range(0, UserFilterRequest.MaxValuesPerField + 1).Select(_ => "Admin")]
        };

        Result result = UserFilterParser.Validate(request);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCodes.UserFilterTooManyValues);
    }

    [Fact]
    public void Validate_QuandLaRechercheDepasseLaLimite_RetourneUneErreur()
    {
        UserFilterRequest request = new() { Search = new string('a', UserFilterRequest.SearchMaxLength + 1) };

        Result result = UserFilterParser.Validate(request);

        result.IsSuccess.Should().BeFalse();
        result.Code.Should().Be(ErrorCodes.UserSearchTooLong);
    }

    [Fact]
    public void Build_AvecPlusieursValeurs_DedupliqueEtConserveLOrdre()
    {
        UserFilterRequest request = new() { Role = ["Developer", "Admin", "developer"], Status = ["Suspended"] };

        UserFilter filter = UserFilterParser.Build(request);

        filter.Roles.Should().Equal(UserRole.Developer, UserRole.Admin);
        filter.Statuses.Should().Equal(UserAccessStatus.Suspended);
    }

    [Fact]
    public void Build_SansAucunFiltre_NeRetientQueLesUtilisateursActifs()
    {
        UserFilter filter = UserFilterParser.Build(new UserFilterRequest());

        filter.Roles.Should().BeEmpty();
        filter.Statuses.Should().Equal(UserAccessStatus.Active);
        filter.Search.Should().BeNull();
    }

    [Fact]
    public void Build_QuandLesStatutsSontDemandes_RemplaceLeStatutParDefaut()
    {
        UserFilterRequest request = new() { Status = ["Suspended"] };

        UserFilter filter = UserFilterParser.Build(request);

        filter.Statuses.Should().Equal(UserAccessStatus.Suspended);
    }
}
