using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Application.Tickets.ExportExcel;

public class TicketExportExcelService(ExportService exportService, ITenantContext tenant) : IService
{
    public async Task<Result<FileDownload>> ExecuteAsync(TicketExportExcelModel model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<FileDownload>.Unauthorized();

        ExportResult export = await exportService.ExportTicketsExcelAsync(
            organizationId, model.Status, model.Priority, model.AssignedTo, model.Type, model.Search, userId);

        return FileDownload.FromBytes(export.Content, ContentTypes.Excel, export.FileName);
    }
}
