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
public partial class RemediationService(
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
                    Error = ErrorCodes.RemediationAlreadyRunning
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
            request.Error = ErrorCodes.RemediationInternalError;
            logger.LogError(ex, "Remediation failed for project {ProjectId}", projectId);
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
                ? ErrorCodes.RemediationPullRequestAlreadyOpen
                : ErrorCodes.RemediationAlreadyRunning
        };

}
