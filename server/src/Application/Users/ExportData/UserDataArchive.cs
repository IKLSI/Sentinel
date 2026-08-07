using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Sentinel.Domain.Constants;

namespace Sentinel.Application.Users.ExportData;

public sealed record UserDataArchiveFile(Guid AttachmentId, int TicketNumber, string FileName, byte[] Content);

public static class UserDataArchive
{
    public const string ManifestEntryName = "export.json";
    public const string AttachmentsDirectory = "attachments";

    private static readonly JsonSerializerOptions ManifestOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static byte[] Build(UserDataExportDto export, IReadOnlyList<UserDataArchiveFile> files)
    {
        using MemoryStream buffer = new();

        using (ZipArchive archive = new(buffer, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (UserDataArchiveFile file in files)
            {
                string entryName = EntryName(file);

                UserExportAttachmentDto? attachment = export.Attachments
                    .FirstOrDefault(candidate => candidate.Id == file.AttachmentId);

                if (attachment != null)
                    attachment.ArchivePath = entryName;

                using Stream entry = archive.CreateEntry(entryName, CompressionLevel.Optimal).Open();
                entry.Write(file.Content);
            }

            using Stream manifest = archive.CreateEntry(ManifestEntryName, CompressionLevel.Optimal).Open();
            manifest.Write(JsonSerializer.SerializeToUtf8Bytes(export, ManifestOptions));
        }

        return buffer.ToArray();
    }

    public static string FileName(DateTime exportedAt) => $"sentinel-export-{exportedAt:yyyy-MM-dd}.zip";

    private static string EntryName(UserDataArchiveFile file) =>
        $"{AttachmentsDirectory}/{file.TicketNumber}-{file.AttachmentId:N}-{SafeFileName(file.FileName)}";

    private static string SafeFileName(string fileName)
    {
        StringBuilder builder = new(fileName.Length);

        foreach (char character in fileName)
            builder.Append(char.IsLetterOrDigit(character) || character is '.' or '-' or '_' ? character : '-');

        string safe = builder.ToString().Trim('-', '.');
        return string.IsNullOrEmpty(safe) ? "fichier" : Truncate(safe);
    }

    private static string Truncate(string value) =>
        value.Length <= ExportLimits.MaxArchiveFileNameLength ? value : value[..ExportLimits.MaxArchiveFileNameLength];
}
