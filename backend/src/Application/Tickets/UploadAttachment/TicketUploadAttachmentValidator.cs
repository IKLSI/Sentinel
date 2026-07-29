using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Tickets.UploadAttachment;

public class TicketUploadAttachmentValidator : IValidator
{
    private static readonly string[] AllowedMimeTypes =
    [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf", "text/plain", "application/zip",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    public Task<Result> ValidateAsync(TicketAttachmentUploadModel? model, CancellationToken cancellationToken)
    {
        if (model == null || model.Size == 0)
            return Task.FromResult(Result.Error(ErrorCodes.TicketAttachmentInvalidFile));

        if (!AllowedMimeTypes.Contains(model.ContentType))
            return Task.FromResult(Result.Error(ErrorCodes.TicketAttachmentTypeNotAllowed));

        if (string.IsNullOrWhiteSpace(model.SanitizedFileName))
            return Task.FromResult(Result.Error(ErrorCodes.TicketAttachmentInvalidFileName));

        return Task.FromResult(Result.Success());
    }
}
