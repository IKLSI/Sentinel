using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.ExportSbom;

public class ProjectSbomExportService(
    SbomService sbomService,
    IProjectRepository projectRepository,
    ITenantContext tenant) : IService
{
    private const string SpdxFormat = "spdx";
    private const string VexFormat = "vex";

    public async Task<Result<FileDownload>> ExecuteAsync(Guid projectId, string? format, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<FileDownload>.Unauthorized();

        bool projectExists = await projectRepository.ExistsInOrganizationAsync(projectId, organizationId,
            cancellationToken);

        if (!projectExists)
            return Result<FileDownload>.NotFound(ErrorCodes.ProjectNotFound);

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
