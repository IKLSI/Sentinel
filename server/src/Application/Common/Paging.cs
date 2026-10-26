namespace Sentinel.Application.Common;

public static class Paging
{
    public static int NormalizePage(int page) => page < 1 ? 1 : page;

    public static int NormalizePageSize(int pageSize, int defaultPageSize, int maxPageSize) => pageSize switch
    {
        < 1 => defaultPageSize,
        _ when pageSize > maxPageSize => maxPageSize,
        _ => pageSize
    };
}
