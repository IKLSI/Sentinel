using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.ApiKeys;

namespace Sentinel.Application.ApiKeys.Create;

public class ApiKeyCreateValidator : IValidator
{
    public const int NameMaxLength = 100;

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

        return Task.FromResult(Result.Success());
    }
}
