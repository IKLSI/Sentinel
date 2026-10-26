namespace Sentinel.Domain.Constants;

public static class ExportLimits
{
    public const int MaxTicketRows = 10_000;
    public const int MaxProjectSheets = 100;
    public const int MaxUserExportRows = 5_000;
    public const long MaxUserExportAttachmentBytes = 200L * 1024 * 1024;
    public const long MaxUserExportInFlightBytes = 16L * 1024 * 1024;
    public const int MaxUserExportAttachmentBatch = 25;
    public const int MaxArchiveFileNameLength = 120;
    public const int MaxComplianceVulnerabilityRows = 200;
    public const int MaxComplianceAuditLogRows = 25;

    public static (List<T> Rows, bool Truncated) Cap<T>(IEnumerable<T> rows, int max)
    {
        List<T> capped = rows.ToList();
        bool truncated = capped.Count > max;

        if (truncated)
            capped.RemoveRange(max, capped.Count - max);

        return (capped, truncated);
    }
}
