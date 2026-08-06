using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.JsonWebTokens;
using Sentinel.API.Services;
using Sentinel.Domain.Constants;

namespace Sentinel.Tests.Services;

public class TenantContextTests
{
    [Fact]
    public void OrganizationId_QuandLePrincipalEstPoseApresUneLectureAnonyme_EstResoluSansReset()
    {
        DefaultHttpContext httpContext = new DefaultHttpContext();
        IHttpContextAccessor accessor = new HttpContextAccessor { HttpContext = httpContext };

        TenantContext sut = new TenantContext(accessor);

        sut.OrganizationId.Should().BeNull();

        Guid organizationId = Guid.NewGuid();
        Guid userId = Guid.NewGuid();
        httpContext.User = BuildPrincipal(organizationId, userId, "cle-api");

        sut.ShouldSatisfyTenant(organizationId, userId, "cle-api");
    }

    [Fact]
    public void Reset_QuandLePrincipalEstPoseParLaCleApi_ReprendLeNouveauPrincipal()
    {
        DefaultHttpContext httpContext = new DefaultHttpContext();
        IHttpContextAccessor accessor = new HttpContextAccessor { HttpContext = httpContext };

        TenantContext sut = new TenantContext(accessor);

        sut.OrganizationId.Should().BeNull();

        Guid organizationId = Guid.NewGuid();
        Guid userId = Guid.NewGuid();
        httpContext.User = BuildPrincipal(organizationId, userId, "cle-api");
        sut.Reset();

        sut.ShouldSatisfyTenant(organizationId, userId, "cle-api");
    }

    [Fact]
    public void OrganizationId_QuandLaRequeteResteAnonyme_RetourneNull()
    {
        DefaultHttpContext httpContext = new DefaultHttpContext();
        IHttpContextAccessor accessor = new HttpContextAccessor { HttpContext = httpContext };

        TenantContext sut = new TenantContext(accessor);

        sut.OrganizationId.Should().BeNull();
        sut.UserId.Should().BeNull();
        sut.IsSet.Should().BeFalse();
    }

    [Fact]
    public void OrganizationId_UneFoisResolu_NeChangePlusDansLaMemeRequete()
    {
        DefaultHttpContext httpContext = new DefaultHttpContext();
        IHttpContextAccessor accessor = new HttpContextAccessor { HttpContext = httpContext };

        Guid premiereOrganisation = Guid.NewGuid();
        httpContext.User = BuildPrincipal(premiereOrganisation, Guid.NewGuid(), "jti-1");

        TenantContext sut = new TenantContext(accessor);

        sut.OrganizationId.Should().Be(premiereOrganisation);

        httpContext.User = BuildPrincipal(Guid.NewGuid(), Guid.NewGuid(), "jti-2");

        sut.OrganizationId.Should().Be(premiereOrganisation);
    }

    private static ClaimsPrincipal BuildPrincipal(Guid organizationId, Guid userId, string jti)
    {
        Claim[] claims =
        [
            new Claim(ClaimNames.OrganizationId, organizationId.ToString()),
            new Claim(ClaimNames.UserId, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, jti)
        ];

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
    }
}

file static class TenantContextAssertions
{
    public static void ShouldSatisfyTenant(this TenantContext context, Guid organizationId, Guid userId, string jti)
    {
        context.OrganizationId.Should().Be(organizationId);
        context.UserId.Should().Be(userId);
        context.Jti.Should().Be(jti);
        context.IsSet.Should().BeTrue();
    }
}
