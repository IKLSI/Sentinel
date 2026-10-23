using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.Remediation.GetRemediationConfig;

public class RemediationConfigService(
    IVulnerabilityRemediationRepository remediationRepository,
    IProjectRepository projectRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
    IOrganizationRepository organizationRepository,
    TokenProtector tokenProtector,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope) : IService
{
    public async Task<Result<JsonObject>> ExecuteAsync(Guid remediationId, string? configTicket,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(configTicket))
            return Result<JsonObject>.Unauthorized(ErrorCodes.RemediationTicketInvalid);

        using IDisposable elevation = systemScope.Enter();

        VulnerabilityRemediation? remediation = await remediationRepository.GetOrDefaultWithProjectAsync(
            remediationId, QueryTracking.Tracked, cancellationToken);

        if (remediation == null || !AcceptsTicket(remediation, configTicket))
            return Result<JsonObject>.Unauthorized(ErrorCodes.RemediationTicketInvalid);

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            remediation.ConfigTicketHash = null;
            remediation.ConfigTicketExpiresAt = null;

            await commitScope.CommitAsync(cancellationToken);
        }

        if (!RepositoryLocation.TryParse(remediation.Project.RepositoryUrl, out RepositoryLocation location))
            return Result<JsonObject>.Error(ErrorCodes.ProjectInvalidRepositoryUrl);

        IReadOnlyList<RemediationTarget> targets = await TargetsOfAsync(remediation.ProjectId, cancellationToken);

        if (targets.Count == 0)
            return Result<JsonObject>.Error(ErrorCodes.RemediationNotEligible);

        Organization? organization = await organizationRepository.GetOrDefaultAsync(remediation.OrganizationId,
            QueryTracking.NoTracking, cancellationToken);

        RepositoryAccess access = RepositoryAccessFactory.For(remediation.Project, organization, tokenProtector);

        if (string.IsNullOrEmpty(access.Token))
            return Result<JsonObject>.Error(ErrorCodes.RemediationTokenMissing);

        return RenovateConfigBuilder.Build(targets, remediation.Project, location, access);
    }

    private async Task<IReadOnlyList<RemediationTarget>> TargetsOfAsync(Guid projectId,
        CancellationToken cancellationToken)
    {
        Project? project = await projectRepository.GetOrDefaultWithHealthDetailsAsync(projectId,
            QueryTracking.NoTracking, cancellationToken);

        if (project == null) return [];

        IReadOnlySet<string> suppressedKeys =
            await suppressionRepository.ListActiveFindingKeysAsync(projectId, DateTime.UtcNow, cancellationToken);

        return RemediationRules.TargetsFor(RemediationRules.RemediableFindings(project.Dependencies, suppressedKeys));
    }

    private static bool AcceptsTicket(VulnerabilityRemediation remediation, string configTicket) =>
        remediation is { Status: RemediationStatus.Queued or RemediationStatus.Running }
        && remediation.ConfigTicketHash != null
        && remediation.ConfigTicketExpiresAt > DateTime.UtcNow
        && CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(remediation.ConfigTicketHash),
            Encoding.UTF8.GetBytes(SecureToken.Hash(configTicket)));
}
