namespace Sentinel.Application.Common;

public static class SearchPattern
{
    public static string Like(string search)
    {
        string escaped = search
            .Replace("\\", "\\\\")
            .Replace("%", "\\%")
            .Replace("_", "\\_");

        return $"%{escaped}%";
    }
}
