using Sentinel.Application.Abstractions;
using Sentinel.Application.Billing;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.TechHealth.ExportSbom;

public class ProjectSbomExportService(SbomService sbomService, QuotaGuard quotaGuard, ITenantContext tenant) : IService
{
    private const string SpdxFormat = "spdx";

    public async Task<Result<FileDownload>> ExecuteAsync(Guid projectId, string? format, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<FileDownload>.Unauthorized();

        Result planResult = await quotaGuard.EnsureComplianceExportsAllowedAsync(organizationId, cancellationToken);

        if (!planResult.IsSuccess)
            return Result<FileDownload>.From(planResult);

        SbomFormat sbomFormat = string.Equals(format, SpdxFormat, StringComparison.OrdinalIgnoreCase)
            ? SbomFormat.Spdx
            : SbomFormat.CycloneDx;

        ExportResult? export = await sbomService.GenerateAsync(projectId, organizationId, sbomFormat, cancellationToken);

        if (export == null)
            return Result<FileDownload>.NotFound(ErrorCodes.ProjectNotFound);

        return FileDownload.FromBytes(export.Content, ContentTypes.Json, export.FileName);
    }
}
