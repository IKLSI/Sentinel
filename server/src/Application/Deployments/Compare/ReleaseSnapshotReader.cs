using Sentinel.Application.Scanning;
using Sentinel.Domain.Abstractions;

namespace Sentinel.Application.Deployments.Compare;

public sealed record ReleaseSnapshot(
    ScanOutcome Inventory,
    Dictionary<string, Dictionary<string, ConfigurationValue>> Configuration);

public sealed record ReleaseSnapshots(ReleaseSnapshot Base, ReleaseSnapshot Head, List<ReleaseMigration> Migrations);

public class ReleaseSnapshotReader(IRepositoryHostClient repositoryHostClient, RepositoryScannerService scanner)
{
    public async Task<ReleaseSnapshots?> ReadAsync(ReleaseRepository repository, string baseSha, string headSha,
        RepositoryComparison comparison, CancellationToken cancellationToken)
    {
        string? rootPath = repository.Project.RootPath;
        ReleaseReadPlan? plan = comparison.Truncated
            ? await FullPlanAsync(repository, baseSha, headSha, cancellationToken)
            : await TargetedPlanAsync(repository, headSha, comparison, cancellationToken);

        if (plan == null) return null;

        Task<ScanOutcome> baseInventory = ReadInventoryAsync(repository, plan.BaseManifests, baseSha, cancellationToken);
        Task<ScanOutcome> headInventory = ReadInventoryAsync(repository, plan.HeadManifests, headSha, cancellationToken);
        Task<Dictionary<string, Dictionary<string, ConfigurationValue>>> baseConfiguration =
            ReadConfigurationAsync(repository, plan.BaseConfiguration, baseSha, cancellationToken);
        Task<Dictionary<string, Dictionary<string, ConfigurationValue>>> headConfiguration =
            ReadConfigurationAsync(repository, plan.HeadConfiguration, headSha, cancellationToken);
        Task<string?[]> migrations = ReadTextsAsync(repository, plan.AddedMigrations, headSha, cancellationToken);

        await Task.WhenAll(baseInventory, headInventory, baseConfiguration, headConfiguration, migrations);

        string?[] migrationContents = await migrations;

        return new ReleaseSnapshots(
            new ReleaseSnapshot(await baseInventory, await baseConfiguration),
            new ReleaseSnapshot(await headInventory, await headConfiguration),
            plan.AddedMigrations
                .Select((path, index) => new ReleaseMigration(path, MigrationInspector.Inspect(path, migrationContents[index])))
                .ToList());
    }

    private async Task<ReleaseReadPlan?> TargetedPlanAsync(ReleaseRepository repository, string headSha,
        RepositoryComparison comparison, CancellationToken cancellationToken)
    {
        if (!ReleaseFileScope.TouchesDependencies(comparison.Files, repository.Project.RootPath))
            return ReleaseFileScope.Targeted(comparison.Files, [], repository.Project.RootPath);

        RepositoryFileListing listing = await ListAsync(repository, headSha, cancellationToken);
        if (listing.Files.Count == 0) return null;

        return ReleaseFileScope.Targeted(comparison.Files, listing.Files.Select(file => file.Path).ToList(),
            repository.Project.RootPath);
    }

    private async Task<ReleaseReadPlan?> FullPlanAsync(ReleaseRepository repository, string baseSha, string headSha,
        CancellationToken cancellationToken)
    {
        Task<RepositoryFileListing> baseListing = ListAsync(repository, baseSha, cancellationToken);
        Task<RepositoryFileListing> headListing = ListAsync(repository, headSha, cancellationToken);
        await Task.WhenAll(baseListing, headListing);

        if ((await baseListing).Files.Count == 0 || (await headListing).Files.Count == 0) return null;

        return ReleaseFileScope.Full(
            (await baseListing).Files.Select(file => file.Path).ToList(),
            (await headListing).Files.Select(file => file.Path).ToList(),
            repository.Project.RootPath);
    }

    private Task<RepositoryFileListing> ListAsync(ReleaseRepository repository, string sha,
        CancellationToken cancellationToken) =>
        repositoryHostClient.ListFilesAsync(repository.Location.Host, repository.Location.Owner,
            repository.Location.Repository, repository.Access, sha, cancellationToken);

    private Task<ScanOutcome> ReadInventoryAsync(ReleaseRepository repository, List<string> paths, string sha,
        CancellationToken cancellationToken)
    {
        RepositoryFileListing listing = new(
            paths.Select(path => (Path.GetFileName(path), UrlOf(repository, path, sha), path)).ToList(), false);

        return scanner.ReadInventoryAsync(repository.Project.Id, repository.Project.RepositoryUrl!,
            repository.Location.Host, listing, repository.Project.RootPath, repository.Access, cancellationToken);
    }

    private async Task<Dictionary<string, Dictionary<string, ConfigurationValue>>> ReadConfigurationAsync(
        ReleaseRepository repository, List<string> paths, string sha, CancellationToken cancellationToken)
    {
        string?[] contents = await ReadTextsAsync(repository, paths, sha, cancellationToken);
        Dictionary<string, Dictionary<string, ConfigurationValue>> configuration =
            new(StringComparer.OrdinalIgnoreCase);

        for (int index = 0; index < paths.Count; index++)
        {
            if (contents[index] is not { } content) continue;
            if (ConfigurationDiff.Read(Path.GetFileName(paths[index]), content) is { } keys)
                configuration[paths[index]] = keys;
        }

        return configuration;
    }

    private Task<string?[]> ReadTextsAsync(ReleaseRepository repository, List<string> paths, string sha,
        CancellationToken cancellationToken) =>
        Task.WhenAll(paths.Select(path => repositoryHostClient.FetchTextAsync(repository.Location.Host,
            UrlOf(repository, path, sha), repository.Access, cancellationToken)));

    private string UrlOf(ReleaseRepository repository, string path, string sha) =>
        repositoryHostClient.FileUrl(repository.Location.Host, repository.Location.Owner,
            repository.Location.Repository, repository.Access, path, sha) ?? string.Empty;
}
