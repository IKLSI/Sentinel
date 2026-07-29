using Sentinel.Application.Security;
using Sentinel.Application.TechHealth.Scan;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Remediation;
using Sentinel.Domain.Git;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Remediation;

public record RemediationTarget(
    string Name,
    DependencyEcosystem Ecosystem,
    string CurrentVersion,
    string TargetVersion,
    bool IsBreaking,
    List<string> CveIds);

public record StaleLockfile(string Path, string Command);

public record RemediationPlan(
    string? Reason,
    List<RemediationTarget> Targets,
    List<(string Path, string Content)> FileChanges,
    List<StaleLockfile> StaleLockfiles,
    string Host,
    string Owner,
    string Repo,
    string? Token);

public class RemediationService(
    IRemediationRequestRepository remediationRepository,
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    IDependencyRepository dependencyRepository,
    ICommitScopeFactory commitScopeFactory,
    IRepositoryHostClient hostClient,
    ManifestPatcherService patcher,
    TokenProtector tokenProtector,
    ILogger<RemediationService> logger)
{
    private const int MaxConcurrentDownloads = 10;

    public async Task<RemediationPreviewDto> PreviewAsync(Guid projectId)
    {
        RemediationPlan plan = await BuildPlanAsync(projectId);

        return new RemediationPreviewDto
        {
            CanRemediate = plan.FileChanges.Count > 0,
            Reason = plan.Reason,
            HasBreakingChanges = plan.Targets.Any(t => t.IsBreaking),
            Targets = plan.Targets.Select(ToTargetDto).ToList(),
            Files = plan.FileChanges.Select(f => f.Path).ToList(),
            StaleLockfiles = plan.StaleLockfiles.Select(ToLockfileDto).ToList()
        };
    }

    public async Task<RemediationResultDto> ExecuteAsync(Guid projectId, Guid organizationId, Guid? userId)
    {
        RemediationRequest? existing = await FindActiveRequestAsync(projectId);
        if (existing != null)
            return AlreadyActive(existing);

        RemediationRequest request = new RemediationRequest
        {
            ProjectId = projectId,
            OrganizationId = organizationId,
            CreatedByUserId = userId,
            Status = RemediationStatus.Pending
        };

        if (!await TryCreateRequestAsync(request))
        {
            RemediationRequest? concurrent = await FindActiveRequestAsync(projectId);
            return concurrent != null
                ? AlreadyActive(concurrent)
                : new RemediationResultDto
                {
                    Status = RemediationStatus.Failed.ToString(),
                    Error = "Une remédiation est déjà en cours pour ce projet. Réessayez dans un instant."
                };
        }

        RemediationPlan? plan = null;

        try
        {
            plan = await BuildPlanAsync(projectId);

            request.HasBreakingChanges = plan.Targets.Any(t => t.IsBreaking);
            request.DependenciesPatched = plan.Targets.Count;
            request.TargetsJson = System.Text.Json.JsonSerializer.Serialize(plan.Targets.Select(ToTargetDto));

            if (plan.FileChanges.Count == 0)
            {
                request.Status = RemediationStatus.NoChanges;
                request.Error = plan.Reason;
            }
            else
            {
                string branch = $"sentinel/remediate-{request.Id:N}".Substring(0, 34);
                string title = BuildTitle(plan.Targets);
                string body = BuildBody(plan.Targets, plan.StaleLockfiles);

                HostWriteResult result = await hostClient.CreatePullRequestAsync(
                    plan.Host, plan.Owner, plan.Repo, plan.Token ?? "", branch, title, body, plan.FileChanges);

                request.BranchName = branch;

                if (result.Success)
                {
                    request.Status = RemediationStatus.PullRequestOpen;
                    request.PullRequestUrl = result.Url;
                }
                else
                {
                    request.Status = RemediationStatus.Failed;
                    request.Error = result.Error;
                }
            }
        }
        catch (Exception ex)
        {
            request.Status = RemediationStatus.Failed;
            request.Error = "Erreur interne lors de la génération de la remédiation.";
            logger.LogError(ex, "Échec de la remédiation pour le projet {ProjectId}", projectId);
        }

        request.CompletedAt = DateTime.UtcNow;

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await commitScope.CommitAsync(CancellationToken.None);
        }

        return new RemediationResultDto
        {
            Id = request.Id,
            Status = request.Status.ToString(),
            PullRequestUrl = request.PullRequestUrl,
            Error = request.Error,
            DependenciesPatched = request.DependenciesPatched,
            HasBreakingChanges = request.HasBreakingChanges,
            StaleLockfiles = plan?.StaleLockfiles.Select(ToLockfileDto).ToList() ?? new List<StaleLockfileDto>()
        };
    }

    private async Task<bool> TryCreateRequestAsync(RemediationRequest request)
    {
        try
        {
            using ICommitScope commitScope = commitScopeFactory.Begin();

            await remediationRepository.AddAsync(request, CancellationToken.None);
            await commitScope.CommitAsync(CancellationToken.None);

            return true;
        }
        catch (PersistenceException)
        {
            return false;
        }
    }

    private Task<RemediationRequest?> FindActiveRequestAsync(Guid projectId)
        => remediationRepository.GetOrDefaultActiveByProjectAsync(projectId, CancellationToken.None);

    private static RemediationResultDto AlreadyActive(RemediationRequest request)
        => new RemediationResultDto
        {
            Id = request.Id,
            Status = request.Status.ToString(),
            PullRequestUrl = request.PullRequestUrl,
            DependenciesPatched = request.DependenciesPatched,
            HasBreakingChanges = request.HasBreakingChanges,
            Error = request.Status == RemediationStatus.PullRequestOpen
                ? "Une pull request de remédiation est déjà ouverte pour ce projet. Fusionnez-la ou fermez-la avant d'en générer une nouvelle."
                : "Une remédiation est déjà en cours pour ce projet. Réessayez dans un instant."
        };

    private async Task<RemediationPlan> BuildPlanAsync(Guid projectId)
    {
        Project? project = await projectRepository.GetOrDefaultAsync(projectId,
            QueryTracking.NoTracking, CancellationToken.None);

        if (project == null)
            return Empty("Projet introuvable.");

        if (string.IsNullOrWhiteSpace(project.RepositoryUrl))
            return Empty("Aucun dépôt associé à ce projet.");

        Organization? org = await organizationRepository.GetOrDefaultAsync(project.OrganizationId,
            QueryTracking.NoTracking, CancellationToken.None);

        string? token = tokenProtector.Unprotect(
            project.RepositoryType == RepositoryType.GitLab ? org?.GitlabToken : org?.GithubToken);

        if (string.IsNullOrEmpty(token))
            return Empty("Aucun token d'accès configuré pour la plateforme du dépôt.");

        List<RemediationTarget> targets = await BuildTargetsAsync(projectId);
        if (targets.Count == 0)
            return Empty("Aucune vulnérabilité corrigeable détectée.");

        if (!RepositoryLocation.TryParse(project.RepositoryUrl, out RepositoryLocation location))
            return Empty("URL du dépôt invalide.");

        (string host, string owner, string repo) = (location.Host, location.Owner, location.Repository);

        List<(string Name, string Url)> files = await hostClient.ListFilesAsync(host, owner, repo, token);
        List<(string Name, string Url)> manifests = files
            .Where(f => ManifestPatcherService.IsPatchable(f.Name))
            .ToList();

        (List<(string Path, string Content)> fileChanges, HashSet<DependencyEcosystem> patchedEcosystems) =
            await BuildFileChangesAsync(host, manifests, targets, token);

        if (fileChanges.Count == 0)
            return new RemediationPlan(
                "Impossible d'appliquer les correctifs : manifestes introuvables ou format de déclaration non pris en charge.",
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
                logger.LogWarning("Manifeste patché invalide, correctif ignoré : {File}", name);
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

    private static string BuildTitle(List<RemediationTarget> targets)
        => targets.Count == 1
            ? $"Mise à jour de {targets[0].Name} vers {targets[0].TargetVersion}"
            : $"Correction de {targets.Count} dépendances vulnérables";

    private static string BuildBody(List<RemediationTarget> targets, List<StaleLockfile> staleLockfiles)
    {
        System.Text.StringBuilder sb = new();
        sb.AppendLine("Pull request générée automatiquement par Sentinel pour corriger des vulnérabilités connues.");
        sb.AppendLine();
        sb.AppendLine("| Dépendance | Actuelle | Cible | CVE |");
        sb.AppendLine("| --- | --- | --- | --- |");

        foreach (RemediationTarget t in targets)
        {
            string breaking = t.IsBreaking ? " ⚠️ (changement majeur)" : "";
            sb.AppendLine($"| {t.Name}{breaking} | {t.CurrentVersion} | {t.TargetVersion} | {string.Join(", ", t.CveIds)} |");
        }

        sb.AppendLine();

        if (staleLockfiles.Count > 0)
        {
            sb.AppendLine("### ⚠️ Fichiers de verrouillage à régénérer avant fusion");
            sb.AppendLine();
            sb.AppendLine("Seuls les manifestes ont été modifiés. Régénérez les fichiers de verrouillage pour garder des installations reproductibles :");
            sb.AppendLine();
            sb.AppendLine("| Fichier | Commande |");
            sb.AppendLine("| --- | --- |");
            foreach (StaleLockfile lockfile in staleLockfiles)
                sb.AppendLine($"| `{lockfile.Path}` | `{lockfile.Command}` |");
            sb.AppendLine();
            sb.AppendLine("La CI du dépôt régénère généralement ces fichiers lors de l'étape d'installation.");
        }
        else
        {
            sb.AppendLine("Pensez à vérifier la CI avant de fusionner.");
        }

        return sb.ToString();
    }

    private static RemediationTargetDto ToTargetDto(RemediationTarget target)
        => new RemediationTargetDto
        {
            Name = target.Name,
            Ecosystem = target.Ecosystem.ToString(),
            CurrentVersion = target.CurrentVersion,
            TargetVersion = target.TargetVersion,
            IsBreaking = target.IsBreaking,
            CveIds = target.CveIds
        };

    private static StaleLockfileDto ToLockfileDto(StaleLockfile lockfile)
        => new StaleLockfileDto
        {
            Path = lockfile.Path,
            Command = lockfile.Command
        };
}
