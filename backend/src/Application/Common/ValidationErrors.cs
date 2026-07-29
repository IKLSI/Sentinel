using System.Text.RegularExpressions;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Common;

public sealed partial class ValidationErrors
{
    private readonly List<ValidationError> _errors = [];

    public bool HasErrors => _errors.Count > 0;

    public Result ToResult() => HasErrors ? Result.Invalid(_errors) : Result.Success();

    public Result<T> ToResult<T>() => HasErrors ? Result<T>.Invalid(_errors) : Result<T>.Success(default!);

    public ValidationErrors Add(string identifier, string code,
        IReadOnlyDictionary<string, string>? parameters = null)
    {
        _errors.Add(new ValidationError(identifier, code, parameters));
        return this;
    }

    public ValidationErrors Required(string identifier, string? value, string code) =>
        string.IsNullOrWhiteSpace(value) ? Add(identifier, code) : this;

    public ValidationErrors Required(string identifier, Guid value, string code) =>
        value == Guid.Empty ? Add(identifier, code) : this;

    public ValidationErrors MaxLength(string identifier, string? value, int maxLength,
        string code = ValidationCodes.MaxLength) =>
        value != null && value.Length > maxLength
            ? Add(identifier, code, new Dictionary<string, string> { ["maxLength"] = maxLength.ToString() })
            : this;

    public ValidationErrors MinLength(string identifier, string? value, int minLength, string code) =>
        value != null && value.Length < minLength
            ? Add(identifier, code, new Dictionary<string, string> { ["minLength"] = minLength.ToString() })
            : this;

    public ValidationErrors Email(string identifier, string? value, string code) =>
        !string.IsNullOrWhiteSpace(value) && !EmailPattern().IsMatch(value) ? Add(identifier, code) : this;

    public ValidationErrors Matches(string identifier, string? value, string pattern, string code) =>
        !string.IsNullOrEmpty(value) && !Regex.IsMatch(value, pattern) ? Add(identifier, code) : this;

    public ValidationErrors ParsableEnum<TEnum>(string identifier, string? value, string code)
        where TEnum : struct, Enum =>
        !string.IsNullOrWhiteSpace(value) && !Enum.TryParse(value, true, out TEnum _) ? Add(identifier, code) : this;

    public ValidationErrors DefinedEnum<TEnum>(string identifier, TEnum value, string code)
        where TEnum : struct, Enum =>
        !Enum.IsDefined(value) ? Add(identifier, code) : this;

    public ValidationErrors InRange(string identifier, decimal? value, decimal min, decimal max,
        string minCode, string maxCode)
    {
        if (value is not decimal actual) return this;
        if (actual < min) return Add(identifier, minCode);
        if (actual > max) return Add(identifier, maxCode);

        return this;
    }

    public ValidationErrors MaxCount<T>(string identifier, IReadOnlyCollection<T>? values, int maxCount, string code) =>
        values != null && values.Count > maxCount
            ? Add(identifier, code, new Dictionary<string, string> { ["maxCount"] = maxCount.ToString() })
            : this;

    public ValidationErrors HttpUrl(string identifier, string? value, string code)
    {
        if (string.IsNullOrWhiteSpace(value)) return this;

        bool valid = Uri.TryCreate(value, UriKind.Absolute, out Uri? uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

        return valid ? this : Add(identifier, code);
    }

    public ValidationErrors StrongPassword(string identifier, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return Add(identifier, ValidationCodes.PasswordRequired);

        MinLength(identifier, value, 12, ValidationCodes.PasswordMinLength);
        MaxLength(identifier, value, 128, ValidationCodes.PasswordMaxLength);
        Matches(identifier, value, "[a-z]", ValidationCodes.PasswordLowercase);
        Matches(identifier, value, "[A-Z]", ValidationCodes.PasswordUppercase);
        Matches(identifier, value, "\\d", ValidationCodes.PasswordDigit);
        Matches(identifier, value, "[^A-Za-z0-9]", ValidationCodes.PasswordSpecialCharacter);

        return this;
    }

    public ValidationErrors EmailAddress(string identifier, string? value, string requiredCode)
    {
        if (string.IsNullOrWhiteSpace(value)) return Add(identifier, requiredCode);

        Email(identifier, value, ValidationCodes.EmailInvalidFormat);
        MaxLength(identifier, value, 254);

        return this;
    }

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailPattern();
}
