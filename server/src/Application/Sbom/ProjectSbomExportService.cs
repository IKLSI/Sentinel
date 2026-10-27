using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Sbom;

public class ProjectSbomExportService(
    SbomService sbomService,
    ITenantContext tenant) : IService
{
    private const string SpdxFormat = "spdx";
    private const string VexFormat = "vex";

    public async Task<Result<FileDownload>> ExecuteAsync(Guid projectId, string? format, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<FileDownload>.Unauthorized();

        SbomFormat sbomFormat = format?.ToLowerInvariant() switch
        {
            SpdxFormat => SbomFormat.Spdx,
            VexFormat => SbomFormat.Vex,
            _ => SbomFormat.CycloneDx
        };

        ExportResult? export = await sbomService.GenerateAsync(projectId, organizationId, sbomFormat, cancellationToken);

        if (export == null)
            return Result<FileDownload>.NotFound(ErrorCodes.ProjectNotFound);

        return FileDownload.FromBytes(export.Content, ContentTypes.Json, export.FileName);
    }
}
