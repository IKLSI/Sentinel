using Sentinel.Application.Tickets.UploadAttachment;

namespace Sentinel.API.Extensions;

public static class FormFileExtensions
{
    public static TicketAttachmentUploadModel? ToUploadModel(this IFormFile? file) => file == null
        ? null
        : new TicketAttachmentUploadModel
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            Size = file.Length,
            Content = file.OpenReadStream()
        };
}
