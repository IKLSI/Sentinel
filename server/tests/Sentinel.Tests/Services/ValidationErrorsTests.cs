using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class ValidationErrorsTests
{
    [Fact]
    public void ToResult_WhenNoRuleFails_ReturnsSuccess()
    {
        Result result = new ValidationErrors()
            .Required("Nom", "valeur", ValidationCodes.MaxLength)
            .MaxLength("Nom", "valeur", 10)
            .ToResult();

        result.IsSuccess.Should().BeTrue();
        result.ValidationErrors.Should().BeEmpty();
    }

    [Fact]
    public void MaxLength_WhenValueTooLong_ExposesMaxLengthParam()
    {
        Result result = new ValidationErrors()
            .MaxLength("Nom", new string('a', 11), 10)
            .ToResult();

        result.Status.Should().Be(ResultStatus.Invalid);
        result.ValidationErrors.Single().Params!["maxLength"].Should().Be("10");
    }

    [Fact]
    public void StrongPassword_WhenPasswordIsWeak_AccumulatesEveryFailedRule()
    {
        Result result = new ValidationErrors()
            .StrongPassword("MotDePasse", "abc")
            .ToResult();

        result.ValidationErrors.Select(error => error.Code).Should().Contain(
        [
            ValidationCodes.PasswordMinLength,
            ValidationCodes.PasswordUppercase,
            ValidationCodes.PasswordDigit,
            ValidationCodes.PasswordSpecialCharacter
        ]);
    }

    [Fact]
    public void StrongPassword_WhenPasswordIsEmpty_ReturnsOnlyRequiredError()
    {
        Result result = new ValidationErrors()
            .StrongPassword("MotDePasse", string.Empty)
            .ToResult();

        result.ValidationErrors.Should().ContainSingle(error =>
            error.Code == ValidationCodes.PasswordRequired);
    }

    [Theory]
    [InlineData("utilisateur@test.fr", true)]
    [InlineData("utilisateur@test", false)]
    [InlineData("pas-un-email", false)]
    public void EmailAddress_ValidatesFormat(string email, bool expectedValid)
    {
        Result result = new ValidationErrors()
            .EmailAddress("Email", email, ValidationCodes.EmailRequired)
            .ToResult();

        result.IsSuccess.Should().Be(expectedValid);
    }

    [Fact]
    public void ParsableEnum_WhenValueIsUnknown_ReturnsInvalid()
    {
        Result result = new ValidationErrors()
            .ParsableEnum<UserRole>("Role", "SuperAdmin", ValidationCodes.RoleInvalid)
            .ToResult();

        result.Status.Should().Be(ResultStatus.Invalid);
    }

    [Fact]
    public void ParsableEnum_WhenValueIsNull_IsIgnored()
    {
        Result result = new ValidationErrors()
            .ParsableEnum<UserRole>("Role", null, ValidationCodes.RoleInvalid)
            .ToResult();

        result.IsSuccess.Should().BeTrue();
    }
}
