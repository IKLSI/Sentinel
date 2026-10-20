namespace Sentinel.Infrastructure.Http;

public sealed record EndOfLifeCycle(string Cycle, bool? IsEndOfLife, DateTime? EndOfLifeDate);

public static class EndOfLifeCatalog
{
    private static readonly Dictionary<string, string> Products = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Node.js"] = "nodejs",
        ["Deno"] = "deno",
        ["Bun"] = "bun",
        ["Python"] = "python",
        [".NET"] = "dotnet",
        [".NET Framework"] = "dotnetfx",
        ["PHP"] = "php",
        ["Ruby"] = "ruby",
        ["Go"] = "go",
        ["Java"] = "eclipse-temurin",
        ["Rust"] = "rust",
        ["React"] = "react",
        ["Vue"] = "vue",
        ["Angular"] = "angular",
        ["Next.js"] = "nextjs",
        ["Nuxt"] = "nuxt",
        ["Svelte"] = "svelte",
        ["Express"] = "express",
        ["Django"] = "django",
        ["Laravel"] = "laravel",
        ["Symfony"] = "symfony",
        ["Rails"] = "rails",
        ["Kotlin"] = "kotlin",
        ["Elixir"] = "elixir",
        ["Spring Boot"] = "spring-boot",
        ["Spring Framework"] = "spring-framework",
        ["Quarkus"] = "quarkus-framework",
        ["Phoenix"] = "phoenix-framework",
        ["React Native"] = "react-native",
        ["Gradle"] = "gradle",
        ["Alpine Linux"] = "alpine-linux",
        ["Debian"] = "debian",
        ["Ubuntu"] = "ubuntu",
        ["CentOS"] = "centos",
        ["Rocky Linux"] = "rocky-linux",
        ["AlmaLinux"] = "almalinux",
        ["Amazon Linux"] = "amazon-linux",
        ["Fedora"] = "fedora",
    };

    public static string? ResolveProduct(string runtimeName) =>
        Products.TryGetValue(runtimeName.Trim(), out string? product) ? product : null;

    public static string? NormalizeVersion(string runtimeName, string version)
    {
        string trimmed = version.Trim().TrimStart('v', 'V');

        if (trimmed.Length == 0 || !char.IsDigit(trimmed[0])) return null;

        string[] segments = trimmed
            .Split('.', StringSplitOptions.RemoveEmptyEntries)
            .TakeWhile(segment => segment.All(char.IsDigit))
            .ToArray();

        if (segments.Length == 0) return null;

        if (runtimeName.Equals("Java", StringComparison.OrdinalIgnoreCase)
            && segments.Length >= 2
            && segments[0] == "1")
        {
            segments = segments[1..];
        }

        return string.Join('.', segments);
    }

    public static EndOfLifeCycle? SelectCycle(IReadOnlyCollection<EndOfLifeCycle> cycles, string version)
    {
        if (cycles.Count == 0) return null;

        EndOfLifeCycle? declared = cycles
            .Where(candidate => IsSameOrParentOf(candidate.Cycle, version))
            .OrderByDescending(candidate => candidate.Cycle.Length)
            .FirstOrDefault();

        if (declared != null) return declared;

        return cycles
            .Where(candidate => IsSameOrParentOf(version, candidate.Cycle))
            .OrderByDescending(candidate => candidate.Cycle, VersionSegmentComparer.Instance)
            .FirstOrDefault();
    }

    private static bool IsSameOrParentOf(string parent, string child) =>
        parent == child || child.StartsWith(parent + ".", StringComparison.Ordinal);

    private sealed class VersionSegmentComparer : IComparer<string>
    {
        public static readonly VersionSegmentComparer Instance = new VersionSegmentComparer();

        public int Compare(string? left, string? right)
        {
            int[] leftSegments = Segments(left);
            int[] rightSegments = Segments(right);

            for (int i = 0; i < Math.Max(leftSegments.Length, rightSegments.Length); i++)
            {
                int leftSegment = i < leftSegments.Length ? leftSegments[i] : 0;
                int rightSegment = i < rightSegments.Length ? rightSegments[i] : 0;

                if (leftSegment != rightSegment) return leftSegment.CompareTo(rightSegment);
            }

            return 0;
        }

        private static int[] Segments(string? version) => (version ?? string.Empty)
            .Split('.', StringSplitOptions.RemoveEmptyEntries)
            .Select(segment => int.TryParse(segment, out int parsed) ? parsed : 0)
            .ToArray();
    }
}
