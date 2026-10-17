using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.CreateProject;

public class ProjectCreateValidator : IValidator
{
    public Task<Result> ValidateAsync(CreateProjectDto model, string gitLabHost, CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .Required(nameof(model.Name), model.Name, ValidationCodes.ProjectNameRequired)
            .MaxLength(nameof(model.Name), model.Name, 200, ValidationCodes.ProjectNameMaxLength)
            .MaxLength(nameof(model.RepositoryUrl), model.RepositoryUrl, 500)
            .HttpUrl(nameof(model.RepositoryUrl), model.RepositoryUrl,
                ValidationCodes.ProjectRepositoryUrlInvalid)
            .Required(nameof(model.RepositoryType), model.RepositoryType,
                ValidationCodes.ProjectRepositoryTypeInvalid)
            .ParsableEnum<RepositoryType>(nameof(model.RepositoryType), model.RepositoryType,
                ValidationCodes.ProjectRepositoryTypeInvalid)
            .Required(nameof(model.ScanFrequency), model.ScanFrequency,
                ValidationCodes.ProjectScanFrequencyInvalid)
            .ParsableEnum<ScanFrequency>(nameof(model.ScanFrequency), model.ScanFrequency,
                ValidationCodes.ProjectScanFrequencyInvalid);

        if (errors.HasErrors)
            return Task.FromResult(errors.ToResult());

        if (!IsRepositoryUrlAllowed(model.RepositoryUrl, gitLabHost))
            return Task.FromResult(Result.Error(ErrorCodes.ProjectInvalidRepositoryUrl));

        return Task.FromResult(Result.Success());
    }

    private static bool IsRepositoryUrlAllowed(string? url, string gitLabHost)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;
        if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri)) return false;
        if (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp) return false;

        return RepositoryHosts.IsSupported(uri.Host, gitLabHost);
    }
}
