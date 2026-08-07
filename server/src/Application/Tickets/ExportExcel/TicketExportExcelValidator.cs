using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;

namespace Sentinel.Application.Tickets.ExportExcel;

public class TicketExportExcelValidator : IValidator
{
    public Task<Result> ValidateAsync(TicketExportExcelModel model, CancellationToken cancellationToken) =>
        Task.FromResult(TicketFilterParser.Validate(model));
}
