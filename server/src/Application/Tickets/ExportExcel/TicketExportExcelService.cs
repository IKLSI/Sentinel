using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Application.Tickets.ExportExcel;

public class TicketExportExcelService(
    ExportService exportService,
    ITenantContext tenant,
    TicketExportExcelValidator validator) : IService
{
    public async Task<Result<FileDownload>> ExecuteAsync(TicketExportExcelModel model, CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<FileDownload>.Unauthorized();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<FileDownload>.From(validationResult);

        ExportResult export = await exportService.ExportTicketsExcelAsync(
            organizationId, TicketFilterParser.Build(model), userId, cancellationToken);

        return FileDownload.FromBytes(export.Content, ContentTypes.Excel, export.FileName);
    }
}
