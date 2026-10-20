namespace Sentinel.Application.Tickets.UploadAttachment;

public class TicketAttachmentUploadModel
{
    public const int MaxFileNameLength = 255;

    private static readonly char[] ForbiddenFileNameChars =
        Path.GetInvalidFileNameChars().Concat(['"', '<', '>', '|', ':', '*', '?', '\\', '/']).ToArray();

    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long Size { get; init; }
    public required Stream Content { get; init; }

    public string SanitizedFileName => Truncate(string.Concat(LastPathSegment(FileName)
            .Where(c => !char.IsControl(c) && !ForbiddenFileNameChars.Contains(c)))
        .Replace(" ", "_")
        .Trim('.', '_'));

    private static string LastPathSegment(string fileName) =>
        fileName[(fileName.LastIndexOfAny(['/', '\\']) + 1)..];

    private static string Truncate(string fileName)
    {
        if (fileName.Length <= MaxFileNameLength) return fileName;

        string extension = Path.GetExtension(fileName);

        if (extension.Length >= MaxFileNameLength) return fileName[..MaxFileNameLength];

        return fileName[..(MaxFileNameLength - extension.Length)] + extension;
    }
}
