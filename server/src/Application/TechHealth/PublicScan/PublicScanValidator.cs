using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.TechHealth.PublicScan;

public class PublicScanValidator : IValidator
{
    public Task<Result> ValidateAsync(PublicScanRequest model, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.RepositoryUrl), model.RepositoryUrl, ValidationCodes.ProjectRepositoryUrlInvalid)
            .MaxLength(nameof(model.RepositoryUrl), model.RepositoryUrl, 500)
            .HttpUrl(nameof(model.RepositoryUrl), model.RepositoryUrl, ValidationCodes.ProjectRepositoryUrlInvalid);

        if (errors.HasErrors)
            return Task.FromResult(errors.ToResult());

        if (!IsRepositoryUrlAllowed(model.RepositoryUrl))
            return Task.FromResult(Result.Error(ErrorCodes.ScanInvalidRepositoryUrl));

        return Task.FromResult(Result.Success());
    }

    private static bool IsRepositoryUrlAllowed(string? url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri)) return false;
        if (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp) return false;

        return RepositoryHosts.AllowedPublicHosts.Contains(uri.Host);
    }
}
