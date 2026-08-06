using System.Text.RegularExpressions;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Locales.Get;

public partial class LocaleGetValidator : IValidator
{
    public Task<Result> ValidateAsync(string culture, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(culture) || !CulturePattern().IsMatch(culture))
            return Task.FromResult(Result.Error(ErrorCodes.LocaleInvalidCulture));

        return Task.FromResult(Result.Success());
    }

    [GeneratedRegex("^[a-zA-Z]{2}(-[a-zA-Z]{2})?$")]
    private static partial Regex CulturePattern();
}
