namespace Sentinel.Tests.Helpers;

public static class RepositoryFiles
{
    private const string SolutionFileName = "Sentinel.slnx";

    public static string? FindByNameOrDefault(string relativeDirectory, string fileName)
    {
        string? root = LocateRootOrDefault();

        if (root == null)
            return null;

        string directory = Path.Combine(root, relativeDirectory.Replace('/', Path.DirectorySeparatorChar));

        return Directory.Exists(directory)
            ? Directory.EnumerateFiles(directory, fileName, SearchOption.AllDirectories).FirstOrDefault()
            : null;
    }

    private static string? LocateRootOrDefault()
    {
        DirectoryInfo? directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory != null)
        {
            if (File.Exists(Path.Combine(directory.FullName, SolutionFileName)))
                return directory.FullName;

            directory = directory.Parent;
        }

        return null;
    }
}
