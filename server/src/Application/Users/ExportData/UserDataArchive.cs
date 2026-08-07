using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Users.ExportData;

public static class UserDataArchive
{
    public const string ManifestEntryName = "export.json";
    public const string AttachmentsDirectory = "attachments";

    private const string FallbackFileName = "fichier";
    private const int MaxExtensionLength = 16;

    private static readonly JsonSerializerOptions ManifestOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static string FileName(DateTime exportedAt) => $"sentinel-export-{exportedAt:yyyy-MM-dd}.zip";

    public static string EntryName(UserExportAttachmentDto attachment) =>
        $"{AttachmentsDirectory}/{attachment.TicketNumber}-{attachment.Id:N}-{SafeFileName(attachment.FileName)}";

    public static async Task WriteFileAsync(ZipArchive archive, string entryName, byte[] content,
        CancellationToken cancellationToken)
    {
        await using Stream entry = await archive.CreateEntry(entryName, CompressionLevel.Optimal)
            .OpenAsync(cancellationToken);

        await entry.WriteAsync(content, cancellationToken);
    }

    public static async Task WriteManifestAsync(ZipArchive archive, UserDataExportDto export,
        IReadOnlyDictionary<Guid, string> archivePaths, bool filesTruncated, CancellationToken cancellationToken)
    {
        await using Stream manifest = await archive.CreateEntry(ManifestEntryName, CompressionLevel.Optimal)
            .OpenAsync(cancellationToken);

        await JsonSerializer.SerializeAsync(manifest, Describe(export, archivePaths, filesTruncated), ManifestOptions,
            cancellationToken);
    }

    private static UserDataExportDto Describe(UserDataExportDto export,
        IReadOnlyDictionary<Guid, string> archivePaths, bool filesTruncated) => export with
    {
        Attachments = [.. export.Attachments.Select(attachment => attachment with
        {
            ArchivePath = archivePaths.GetValueOrDefault(attachment.Id)
        })],
        Truncated = export.Truncated with { AttachmentFiles = filesTruncated }
    };

    private static string SafeFileName(string fileName)
    {
        StringBuilder builder = new(fileName.Length);

        foreach (char character in fileName)
            builder.Append(char.IsLetterOrDigit(character) || character is '.' or '-' or '_' ? character : '-');

        string safe = builder.ToString().Trim('-', '.');
        return string.IsNullOrEmpty(safe) ? FallbackFileName : Truncate(safe);
    }

    private static string Truncate(string value)
    {
        if (value.Length <= ExportLimits.MaxArchiveFileNameLength) return value;

        string extension = Path.GetExtension(value);

        return extension.Length is 0 or > MaxExtensionLength
            ? value[..ExportLimits.MaxArchiveFileNameLength]
            : value[..(ExportLimits.MaxArchiveFileNameLength - extension.Length)] + extension;
    }
}
