using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Tickets.UploadAttachment;

public class TicketUploadAttachmentValidator : IValidator
{
    private static readonly Dictionary<string, Func<byte[], bool>> MagicByteChecks = new()
    {
        ["image/jpeg"] = b => b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF,
        ["image/png"] = b => b.Length >= 4 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47,
        ["image/gif"] = b => b.Length >= 4 && b[0] == 0x47 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x38,
        ["image/webp"] = b => b.Length >= 12 && b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46
            && b[8] == 0x57 && b[9] == 0x45 && b[10] == 0x42 && b[11] == 0x50,
        ["application/pdf"] = b => b.Length >= 4 && b[0] == 0x25 && b[1] == 0x50 && b[2] == 0x44 && b[3] == 0x46,
        ["application/zip"] = IsZipSignature,
        ["application/msword"] = IsOleSignature,
        ["application/vnd.ms-excel"] = IsOleSignature,
        ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] = IsZipSignature,
        ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] = IsZipSignature
    };

    private static readonly string[] AllowedMimeTypes = MagicByteChecks.Keys.Append("text/plain").ToArray();

    public async Task<Result> ValidateAsync(TicketAttachmentUploadModel? model, CancellationToken cancellationToken)
    {
        if (model == null || model.Size == 0)
            return Result.Error(ErrorCodes.TicketAttachmentInvalidFile);

        if (!AllowedMimeTypes.Contains(model.ContentType))
            return Result.Error(ErrorCodes.TicketAttachmentTypeNotAllowed);

        if (string.IsNullOrWhiteSpace(model.SanitizedFileName))
            return Result.Error(ErrorCodes.TicketAttachmentInvalidFileName);

        if (MagicByteChecks.TryGetValue(model.ContentType, out Func<byte[], bool>? matchesSignature))
        {
            byte[] header = new byte[12];
            int read = await model.Content.ReadAsync(header, cancellationToken);
            model.Content.Seek(0, SeekOrigin.Begin);

            if (read < header.Length || !matchesSignature(header))
                return Result.Error(ErrorCodes.TicketAttachmentTypeNotAllowed);
        }

        return Result.Success();
    }

    private static bool IsZipSignature(byte[] b) =>
        b.Length >= 4 && b[0] == 0x50 && b[1] == 0x4B && (b[2] == 0x03 || b[2] == 0x05 || b[2] == 0x07);

    private static bool IsOleSignature(byte[] b) =>
        b.Length >= 8 && b[0] == 0xD0 && b[1] == 0xCF && b[2] == 0x11 && b[3] == 0xE0
        && b[4] == 0xA1 && b[5] == 0xB1 && b[6] == 0x1A && b[7] == 0xE1;
}
