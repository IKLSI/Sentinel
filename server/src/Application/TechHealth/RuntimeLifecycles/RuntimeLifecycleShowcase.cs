namespace Sentinel.Application.TechHealth.RuntimeLifecycles;

public sealed record RuntimeShowcaseEntry(string RuntimeName, string Version)
{
    public string DisplayName => $"{RuntimeName} {Version}";
}

public static class RuntimeLifecycleShowcase
{
    public static IReadOnlyList<RuntimeShowcaseEntry> Entries { get; } =
    [
        new(".NET", "8"),
        new(".NET", "9"),
        new(".NET", "10"),
        new("Node.js", "20"),
        new("Node.js", "24"),
        new("Python", "3.10"),
        new("PHP", "8.2"),
        new("Ruby", "3.3"),
    ];
}
