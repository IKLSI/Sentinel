using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.ApiKeys.Create;

public class ApiKeyCreateValidator : IValidator
{
    public const int NameMaxLength = 100;
    public const int MaxLifetimeDays = 365;

    public Task<Result> ValidateAsync(CreateApiKeyDto model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(model.Name))
            return Task.FromResult(Result.Error(ErrorCodes.ApiKeyNameRequired));

        if (model.Name.Length > NameMaxLength)
        {
            return Task.FromResult(Result.Error(
                ErrorCodes.ApiKeyNameTooLong,
                new Dictionary<string, string> { ["maxLength"] = NameMaxLength.ToString() }));
        }

        if (model.ExpiresAt is not DateTime expiresAt)
            return Task.FromResult(Result.Error(ErrorCodes.ApiKeyExpirationRequired));

        DateTime expiresAtUtc = DateTime.SpecifyKind(expiresAt, DateTimeKind.Utc);
        DateTime now = DateTime.UtcNow;

        if (expiresAtUtc <= now || expiresAtUtc > now.AddDays(MaxLifetimeDays))
        {
            return Task.FromResult(Result.Error(
                ErrorCodes.ApiKeyExpirationOutOfRange,
                new Dictionary<string, string> { ["maxDays"] = MaxLifetimeDays.ToString() }));
        }

        return Task.FromResult(Result.Success());
    }
}
