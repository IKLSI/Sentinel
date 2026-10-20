using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Settings.ConnectIntegration;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class IntegrationConnectValidatorTests
{
    private readonly IntegrationConnectValidator _sut = new();

    [Fact]
    public async Task ValidateAsync_WhenSelfHostedGitLabIsValid_ReturnsSuccess()
    {
        ConnectIntegrationDto model = new ConnectIntegrationDto { Token = "glpat-test", BaseUrl = "https://git.entreprise.fr" };

        Result result = await _sut.ValidateAsync(model, RepositoryType.GitLab, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateAsync_WhenGitLabUrlIsNotHttp_ReturnsFieldError()
    {
        ConnectIntegrationDto model = new ConnectIntegrationDto { Token = "glpat-test", BaseUrl = "ftp://git.entreprise.fr" };

        Result result = await _sut.ValidateAsync(model, RepositoryType.GitLab, CancellationToken.None);

        result.ValidationErrors.Should().ContainSingle(error =>
            error.Identifier == nameof(ConnectIntegrationDto.BaseUrl)
            && error.Code == ValidationCodes.OrganizationGitlabUrlInvalid);
    }

    [Theory]
    [InlineData("http://git.entreprise.fr")]
    [InlineData("https://localhost")]
    [InlineData("https://127.0.0.1")]
    [InlineData("https://169.254.169.254")]
    [InlineData("https://10.0.0.5")]
    [InlineData("https://user:secret@git.entreprise.fr")]
    public async Task ValidateAsync_WhenGitLabUrlIsNotPublicHttps_ReturnsFieldError(string baseUrl)
    {
        ConnectIntegrationDto model = new ConnectIntegrationDto { Token = "glpat-test", BaseUrl = baseUrl };

        Result result = await _sut.ValidateAsync(model, RepositoryType.GitLab, CancellationToken.None);

        result.ValidationErrors.Should().ContainSingle(error =>
            error.Identifier == nameof(ConnectIntegrationDto.BaseUrl)
            && error.Code == ValidationCodes.OrganizationGitlabUrlInvalid);
    }

    [Fact]
    public async Task ValidateAsync_ForGitHub_IgnoresTheGitLabUrl()
    {
        ConnectIntegrationDto model = new ConnectIntegrationDto { Token = "ghp_test", BaseUrl = "pas-une-url" };

        Result result = await _sut.ValidateAsync(model, RepositoryType.GitHub, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }
}
