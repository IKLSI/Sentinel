namespace Sentinel.Domain.Constants;

public static class ExportLimits
{
    public const int MaxTicketRows = 10_000;
    public const int MaxProjectSheets = 100;
    public const int MaxUserExportRows = 5_000;
    public const long MaxUserExportAttachmentBytes = 200L * 1024 * 1024;
    public const int MaxArchiveFileNameLength = 120;
}
