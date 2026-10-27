using Sentinel.Domain.Entities;

namespace Sentinel.Application.Scanning.Parsers;

internal interface IManifestFileParser
{
    bool CanParse(string fileName);

    void Parse(ManifestDocument manifest, ManifestParseResult result);
}

internal sealed record ManifestDocument(Guid ProjectId, string FileName, string Content)
{
    public bool Is(string fileName) => FileName.Equals(fileName, StringComparison.OrdinalIgnoreCase);
}

internal sealed class ManifestParseResult
{
    public List<Dependency> Dependencies { get; } = new();

    public List<Runtime> Runtimes { get; } = new();

    public LockGraph? Graph { get; set; }
}
