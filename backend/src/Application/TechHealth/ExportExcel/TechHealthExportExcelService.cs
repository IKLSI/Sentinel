using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Application.TechHealth.ExportExcel;

public class TechHealthExportExcelService(ExportService exportService, ITenantContext tenant) : IService
{
    public async Task<Result<FileDownload>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<FileDownload>.Unauthorized();

        ExportResult export = await exportService.ExportTechHealthExcelAsync(organizationId, userId);

        return FileDownload.FromBytes(export.Content, ContentTypes.Excel, export.FileName);
    }
}
