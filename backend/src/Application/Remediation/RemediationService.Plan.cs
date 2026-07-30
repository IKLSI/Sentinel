using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Git;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Remediation;
public partial class RemediationService
{
    private async Task<RemediationPlan> BuildPlanAsync(Guid projectId)
    {
        Project? project = await projectRepository.GetOrDefaultAsync(projectId,
            QueryTracking.NoTracking, CancellationToken.None);

        if (project == null)
            return Empty(ErrorCodes.RemediationProjectNotFound);

        if (string.IsNullOrWhiteSpace(project.RepositoryUrl))
            return Empty(ErrorCodes.RemediationNoRepository);

        Organization? org = await organizationRepository.GetOrDefaultAsync(project.OrganizationId,
            QueryTracking.NoTracking, CancellationToken.None);

        string? token = tokenProtector.Unprotect(
            project.RepositoryType == RepositoryType.GitLab ? org?.GitlabToken : org?.GithubToken);

        if (string.IsNullOrEmpty(token))
            return Empty(ErrorCodes.RemediationTokenMissing);

        List<RemediationTarget> targets = await BuildTargetsAsync(projectId);
        if (targets.Count == 0)
            return Empty(ErrorCodes.RemediationNoFixableVulnerability);

        if (!RepositoryLocation.TryParse(project.RepositoryUrl, out RepositoryLocation location))
            return Empty(ErrorCodes.RemediationInvalidRepositoryUrl);

        (string host, string owner, string repo) = (location.Host, location.Owner, location.Repository);

        List<(string Name, string Url)> files = await hostClient.ListFilesAsync(host, owner, repo, token);
        List<(string Name, string Url)> manifests = files
            .Where(f => ManifestPatcherService.IsPatchable(f.Name))
            .ToList();

        (List<(string Path, string Content)> fileChanges, HashSet<DependencyEcosystem> patchedEcosystems) =
            await BuildFileChangesAsync(host, manifests, targets, token);

        if (fileChanges.Count == 0)
            return new RemediationPlan(
                ErrorCodes.RemediationManifestsNotPatchable,
                targets, fileChanges, new List<StaleLockfile>(), host, owner, repo, token);

        List<StaleLockfile> staleLockfiles = DetectStaleLockfiles(host, files, patchedEcosystems);

        return new RemediationPlan(null, targets, fileChanges, staleLockfiles, host, owner, repo, token);

        static RemediationPlan Empty(string reason)
            => new RemediationPlan(reason, new List<RemediationTarget>(), new List<(string, string)>(),
                new List<StaleLockfile>(), "", "", "", null);
    }

    private static List<StaleLockfile> DetectStaleLockfiles(
        string host, List<(string Name, string Url)> files, HashSet<DependencyEcosystem> patchedEcosystems)
    {
        List<StaleLockfile> stale = new();

        foreach ((string name, string url) in files)
        {
            if (!LockfileRegistry.TryGet(name, out LockfileInfo info)) continue;
            if (!patchedEcosystems.Contains(info.Ecosystem)) continue;

            stale.Add(new StaleLockfile(ExtractRepoPath(host, url), info.RegenerationCommand));
        }

        return stale;
    }

    private async Task<List<RemediationTarget>> BuildTargetsAsync(Guid projectId)
    {
        IReadOnlyList<Dependency> deps =
            await dependencyRepository.ListByProjectWithVulnerabilitiesAsync(projectId, CancellationToken.None);

        List<RemediationTarget> targets = new();

        foreach (Dependency dep in deps)
        {
            List<Vulnerability> fixable = dep.Vulnerabilities
                .Where(v => !string.IsNullOrWhiteSpace(v.FixedVersion))
                .ToList();

            if (fixable.Count == 0) continue;

            string? target = SafeVersionResolver.Resolve(dep.CurrentVersion, fixable.Select(v => v.FixedVersion));
            if (target == null) continue;

            targets.Add(new RemediationTarget(
                dep.Name,
                dep.Ecosystem,
                dep.CurrentVersion,
                target,
                SafeVersionResolver.IsBreaking(dep.CurrentVersion, target),
                fixable.Select(v => v.CveId).Distinct().ToList()));
        }

        return targets;
    }

    private async Task<(List<(string Path, string Content)> Changes, HashSet<DependencyEcosystem> PatchedEcosystems)> BuildFileChangesAsync(
        string host, List<(string Name, string Url)> manifests, List<RemediationTarget> targets, string token)
    {
        using SemaphoreSlim throttle = new SemaphoreSlim(MaxConcurrentDownloads);

        (string Name, string Url, string? Content)[] fetched = await Task.WhenAll(manifests.Select(async file =>
        {
            await throttle.WaitAsync();
            try { return (file.Name, file.Url, await hostClient.FetchTextAsync(host, file.Url, token)); }
            finally { throttle.Release(); }
        }));

        List<(string Path, string Content)> changes = new();
        HashSet<DependencyEcosystem> patchedEcosystems = new();

        foreach ((string name, string url, string? content) in fetched)
        {
            if (content == null) continue;

            string current = content;
            bool changed = false;
            HashSet<DependencyEcosystem> fileEcosystems = new();

            foreach (RemediationTarget target in targets)
            {
                if (!EcosystemMatches(name, target.Ecosystem)) continue;

                if (patcher.TryPatch(name, current, target.Name, target.TargetVersion, out string patched))
                {
                    current = patched;
                    changed = true;
                    fileEcosystems.Add(target.Ecosystem);
                }
            }

            if (!changed) continue;

            if (!ManifestPatcherService.IsStructurallyValid(name, content, current))
            {
                logger.LogWarning("Patched manifest is invalid, fix skipped: {File}", name);
                continue;
            }

            changes.Add((ExtractRepoPath(host, url), current));
            patchedEcosystems.UnionWith(fileEcosystems);
        }

        return (changes, patchedEcosystems);
    }

    private static bool EcosystemMatches(string fileName, DependencyEcosystem ecosystem)
    {
        string lower = fileName.ToLowerInvariant();
        return ecosystem switch
        {
            DependencyEcosystem.Npm => lower == "package.json",
            DependencyEcosystem.Composer => lower == "composer.json",
            DependencyEcosystem.NuGet => lower.EndsWith(".csproj")
                || lower is "directory.packages.props" or "packages.config",
            DependencyEcosystem.PyPI => lower is "requirements.txt" or "pyproject.toml" or "pipfile",
            DependencyEcosystem.Go => lower == "go.mod",
            DependencyEcosystem.Gem => lower == "gemfile",
            DependencyEcosystem.Cargo => lower == "cargo.toml",
            DependencyEcosystem.Hex => lower == "mix.exs",
            DependencyEcosystem.Pub => lower == "pubspec.yaml",
            DependencyEcosystem.Swift => lower == "package.swift",
            DependencyEcosystem.Maven or DependencyEcosystem.Gradle
                => lower is "pom.xml" or "build.gradle" or "build.gradle.kts" or "libs.versions.toml",
            _ => false
        };
    }

    private static string ExtractRepoPath(string host, string url)
    {
        if (host.Contains("github"))
        {
            int marker = url.IndexOf("/HEAD/", StringComparison.Ordinal);
            return marker >= 0 ? url[(marker + "/HEAD/".Length)..] : url;
        }

        if (host.Contains("gitlab"))
        {
            const string start = "/repository/files/";
            const string end = "/raw";
            int s = url.IndexOf(start, StringComparison.Ordinal);
            int e = url.IndexOf(end, StringComparison.Ordinal);
            if (s >= 0 && e > s)
                return Uri.UnescapeDataString(url[(s + start.Length)..e]);
        }

        return url;
    }

}
