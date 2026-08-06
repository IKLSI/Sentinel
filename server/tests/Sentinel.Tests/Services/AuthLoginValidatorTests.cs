using FluentAssertions;
using Sentinel.Application.Auth.Login;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Tests.Services;

public class AuthLoginValidatorTests
{
    private readonly AuthLoginValidator _sut = new();

    [Fact]
    public async Task ValidateAsync_WhenRequestIsValid_ReturnsSuccess()
    {
        LoginRequest model = new LoginRequest { Email = "utilisateur@test.fr", Password = "MotDePasse1!" };

        Result result = await _sut.ValidateAsync(model, CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateAsync_WhenEmailIsEmpty_ReturnsInvalidWithFieldError()
    {
        LoginRequest model = new LoginRequest { Email = string.Empty, Password = "MotDePasse1!" };

        Result result = await _sut.ValidateAsync(model, CancellationToken.None);

        result.Status.Should().Be(ResultStatus.Invalid);
        result.ValidationErrors.Should().ContainSingle(error =>
            error.Identifier == nameof(LoginRequest.Email) && error.Code == ValidationCodes.EmailRequired);
    }

    [Fact]
    public async Task ValidateAsync_WhenEmailFormatIsInvalid_ReturnsInvalid()
    {
        LoginRequest model = new LoginRequest { Email = "pas-un-email", Password = "MotDePasse1!" };

        Result result = await _sut.ValidateAsync(model, CancellationToken.None);

        result.Status.Should().Be(ResultStatus.Invalid);
        result.ValidationErrors.Should().Contain(error => error.Code == ValidationCodes.EmailInvalidFormat);
    }

    [Fact]
    public async Task ValidateAsync_WhenPasswordExceedsMaxLength_ReturnsInvalidWithMaxLengthParam()
    {
        LoginRequest model = new LoginRequest
        {
            Email = "utilisateur@test.fr",
            Password = new string('a', 129)
        };

        Result result = await _sut.ValidateAsync(model, CancellationToken.None);

        ValidationError error = result.ValidationErrors
            .Single(e => e.Code == ValidationCodes.PasswordMaxLength);

        error.Params!["maxLength"].Should().Be("128");
    }
}
