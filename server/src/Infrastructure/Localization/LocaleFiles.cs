namespace Sentinel.Infrastructure.Localization;

internal static class LocaleFiles
{
    public static string DirectoryOf(string contentRootPath) =>
        Path.GetFullPath(Path.Combine(contentRootPath, "Resources", "Locales"));

    public static string? PathOf(string contentRootPath, string culture)
    {
        string directory = DirectoryOf(contentRootPath);
        string path = Path.GetFullPath(Path.Combine(directory, $"{culture}.json"));

        return path.StartsWith(directory + Path.DirectorySeparatorChar, StringComparison.Ordinal) && File.Exists(path)
            ? path
            : null;
    }
}
