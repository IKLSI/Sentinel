using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.TechHealth.ComplianceReport;

public class ProjectComplianceReportService(ComplianceReportService complianceReportService, ITenantContext tenant) : IService
{
    public async Task<Result<FileDownload>> ExecuteAsync(Guid projectId, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<FileDownload>.Unauthorized();

        ExportResult? export = await complianceReportService.GenerateAsync(projectId, organizationId, cancellationToken);

        if (export == null)
            return Result<FileDownload>.NotFound(ErrorCodes.ProjectNotFound);

        return FileDownload.FromBytes(export.Content, ContentTypes.Pdf, export.FileName);
    }
}
