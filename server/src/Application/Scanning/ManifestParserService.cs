using Sentinel.Application.Scanning.Parsers;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Versioning;
using static Sentinel.Application.Scanning.Parsers.ManifestEntries;

namespace Sentinel.Application.Scanning;

public sealed record ManifestParseOutcome(List<Dependency> Dependencies, List<Runtime> Runtimes,
    Exception? Failure, LockGraph? Graph = null);

public sealed record LockGraph(Dictionary<string, List<string>> Edges)
{
    public static string NodeId(string name, string version) => $"{name}@{version}";

    public HashSet<string> ReachableFrom(IEnumerable<string> roots)
    {
        HashSet<string> visited = new(StringComparer.Ordinal);
        Stack<string> pending = new(roots);

        while (pending.Count > 0)
        {
            string node = pending.Pop();

            if (!visited.Add(node) || !Edges.TryGetValue(node, out List<string>? children)) continue;

            foreach (string child in children) pending.Push(child);
        }

        return visited;
    }
}

public class ManifestParserService
{
    public const string WorkflowFileName = GitHubWorkflowParser.FileName;

    private static readonly IManifestFileParser[] Parsers =
    [
        new NodeManifestParser(),
        new NodeLockGraphParser(),
        new DotnetManifestParser(),
        new JvmManifestParser(),
        new PythonManifestParser(),
        new GoManifestParser(),
        new PhpManifestParser(),
        new RubyManifestParser(),
        new RustManifestParser(),
        new ElixirManifestParser(),
        new DartManifestParser(),
        new AppleManifestParser(),
        new GitHubWorkflowParser(),
        new RuntimeFilesParser(),
        new DockerfileParser(),
    ];

    private static readonly Dictionary<(DependencyEcosystem, string), string> RuntimeByDependency = new()
    {
        [(DependencyEcosystem.Maven, "org.springframework:spring-core")] = "Spring Framework",
        [(DependencyEcosystem.Maven, "org.springframework:spring-context")] = "Spring Framework",
        [(DependencyEcosystem.Maven, "io.quarkus:quarkus-core")] = "Quarkus",
        [(DependencyEcosystem.Maven, "io.quarkus.platform:quarkus-bom")] = "Quarkus",
        [(DependencyEcosystem.Hex, "phoenix")] = "Phoenix",
    };

    public static bool IsManifest(string name) => ManifestFileKinds.IsManifest(name);

    public static bool IsLockFile(string name) => ManifestFileKinds.IsLockFile(name);

    public static bool ReportsDirectness(string name) => ManifestFileKinds.ReportsDirectness(name);

    public static bool IsRuntimeDeclaration(string name) => ManifestFileKinds.IsRuntimeDeclaration(name);

    public static int ScanPriority(string name) => ManifestFileKinds.ScanPriority(name);

    public static bool IsWorkflowFile(string url) => GitHubWorkflowParser.IsWorkflowFile(url);

    public (List<Dependency>, List<Runtime>) Parse(Guid projectId, string fileName, string content)
    {
        ManifestParseOutcome outcome = ParseReportingFailure(projectId, fileName, content);

        return (outcome.Dependencies, outcome.Runtimes);
    }

    public ManifestParseOutcome ParseReportingFailure(Guid projectId, string fileName, string content)
    {
        ManifestParseResult result = new ManifestParseResult();
        Exception? failure = null;

        try
        {
            Parsers.FirstOrDefault(parser => parser.CanParse(fileName))
                ?.Parse(new ManifestDocument(projectId, fileName, content), result);
        }
        catch (Exception exception)
        {
            failure = exception;
        }

        if (!IsLockFile(fileName)) AddDependencyDerivedRuntimes(projectId, result);

        return new ManifestParseOutcome(result.Dependencies, result.Runtimes, failure, result.Graph);
    }

    private static void AddDependencyDerivedRuntimes(Guid projectId, ManifestParseResult result)
    {
        foreach (Dependency dependency in result.Dependencies)
        {
            if (!RuntimeByDependency.TryGetValue((dependency.Ecosystem, dependency.Name), out string? runtimeName))
                continue;
            if (!VersionText.StartsWithDigit(dependency.CurrentVersion)) continue;
            if (result.Runtimes.Any(runtime => runtime.Name == runtimeName)) continue;

            result.Runtimes.Add(NewRuntime(projectId, runtimeName, dependency.CurrentVersion, !dependency.IsVersionPinned));
        }
    }
}
