using FluentAssertions;
using Sentinel.Application.ApiKeys.Create;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Tests.Services;

public class ApiKeyCreateValidatorTests
{
    private readonly ApiKeyCreateValidator _sut = new();

    [Fact]
    public async Task ValidateAsync_WithoutExpiration_ReturnsExpirationRequired()
    {
        Result result = await _sut.ValidateAsync(new CreateApiKeyDto { Name = "CI" }, CancellationToken.None);

        result.Code.Should().Be(ErrorCodes.ApiKeyExpirationRequired);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(366)]
    public async Task ValidateAsync_ExpirationOutOfRange_ReturnsOutOfRange(int days)
    {
        CreateApiKeyDto model = new CreateApiKeyDto { Name = "CI", ExpiresAt = DateTime.UtcNow.AddDays(days) };

        Result result = await _sut.ValidateAsync(model, CancellationToken.None);

        result.Code.Should().Be(ErrorCodes.ApiKeyExpirationOutOfRange);
    }

    [Fact]
    public async Task ValidateAsync_ExpirationWithinOneYear_ReturnsSuccess()
    {
        CreateApiKeyDto model = new CreateApiKeyDto { Name = "CI", ExpiresAt = DateTime.UtcNow.AddDays(90) };

        Result result = await _sut.ValidateAsync(model, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }
}
