using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
using Sentinel.Application.Remediation.CompleteRun;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Git;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class CompleteRemediationRunServiceTests
{
    private const string Ticket = "completion-ticket";
    private const string MergeRequestUrl = "https://git.example.com/group/app/-/merge_requests/7";

    [Fact]
    public async Task ExecuteAsync_SucceededRun_OpensTheMergeRequestImmediately()
    {
        using TestScope scope = new TestScope();
        VulnerabilityRemediation remediation = await SeedAsync(scope);

        Result result = await NewService(scope, MergeRequestUrl)
            .ExecuteAsync(remediation.Id, Ticket, new CompleteRemediationRunDto { Succeeded = true },
                CancellationToken.None);

        VulnerabilityRemediation stored = await ReloadAsync(scope, remediation.Id);
        result.IsSuccess.Should().BeTrue();
        stored.Status.Should().Be(RemediationStatus.Opened);
        stored.MergeRequestUrl.Should().Be(MergeRequestUrl);
        stored.CompletionTicketHash.Should().BeNull();
    }

    [Fact]
    public async Task ExecuteAsync_FailedRun_MarksTheRemediationFailed()
    {
        using TestScope scope = new TestScope();
        VulnerabilityRemediation remediation = await SeedAsync(scope);

        await NewService(scope, mergeRequestUrl: null)
            .ExecuteAsync(remediation.Id, Ticket, new CompleteRemediationRunDto { Succeeded = false },
                CancellationToken.None);

        VulnerabilityRemediation stored = await ReloadAsync(scope, remediation.Id);
        stored.Status.Should().Be(RemediationStatus.Failed);
        stored.FailureCode.Should().Be(ErrorCodes.RemediationRunFailed);
    }

    [Fact]
    public async Task ExecuteAsync_WrongTicket_LeavesTheRemediationRunning()
    {
        using TestScope scope = new TestScope();
        VulnerabilityRemediation remediation = await SeedAsync(scope);

        Result result = await NewService(scope, MergeRequestUrl)
            .ExecuteAsync(remediation.Id, "other-ticket", new CompleteRemediationRunDto { Succeeded = true },
                CancellationToken.None);

        result.Code.Should().Be(ErrorCodes.RemediationTicketInvalid);
        (await ReloadAsync(scope, remediation.Id)).Status.Should().Be(RemediationStatus.Running);
    }

    [Fact]
    public async Task ExecuteAsync_TicketReplayedAfterCompletion_IsRejected()
    {
        using TestScope scope = new TestScope();
        VulnerabilityRemediation remediation = await SeedAsync(scope);
        CompleteRemediationRunService sut = NewService(scope, MergeRequestUrl);
        CompleteRemediationRunDto model = new CompleteRemediationRunDto { Succeeded = true };

        await sut.ExecuteAsync(remediation.Id, Ticket, model, CancellationToken.None);
        Result replay = await sut.ExecuteAsync(remediation.Id, Ticket, model, CancellationToken.None);

        replay.Code.Should().Be(ErrorCodes.RemediationTicketInvalid);
    }

    private static async Task<VulnerabilityRemediation> SeedAsync(TestScope scope)
    {
        Organization organization = scope.NewOrganization();

        Project project = new Project
        {
            OrganizationId = scope.OrganizationId,
            Name = "app",
            RepositoryType = RepositoryType.GitLab,
            RepositoryUrl = "https://git.example.com/group/app"
        };

        VulnerabilityRemediation remediation = new VulnerabilityRemediation
        {
            OrganizationId = scope.OrganizationId,
            ProjectId = project.Id,
            BranchName = "sentinel/fix-vulnerabilities",
            Status = RemediationStatus.Running,
            RunnerJobId = "dispatch-1",
            CompletionTicketHash = SecureToken.Hash(Ticket)
        };

        await scope.SeedAsync(organization, project, remediation);

        return remediation;
    }

    private static async Task<VulnerabilityRemediation> ReloadAsync(TestScope scope, Guid remediationId)
    {
        scope.Context.ChangeTracker.Clear();

        return (await new VulnerabilityRemediationRepository(scope.Context).GetOrDefaultAsync(remediationId,
            QueryTracking.NoTracking, CancellationToken.None))!;
    }

    private static CompleteRemediationRunService NewService(TestScope scope, string? mergeRequestUrl)
    {
        VulnerabilityRemediationRepository remediations = new VulnerabilityRemediationRepository(scope.Context);
        RemediationRunJob job = new(remediations, scope.Organizations, new UnusedRunner(),
            new MergeRequestHost(mergeRequestUrl),
            new TokenProtector(new EphemeralDataProtectionProvider(), NullLogger<TokenProtector>.Instance),
            scope.CommitScopeFactory, new NoopJobScheduler(), new NoopRealtimeNotifier(), new FakeSystemScope(),
            NullLogger<RemediationRunJob>.Instance);

        return new CompleteRemediationRunService(remediations, job, new FakeSystemScope());
    }

    private sealed class UnusedRunner : IRemediationRunner
    {
        public bool IsConfigured => true;

        public Task<string?> StartAsync(Guid remediationId, string configTicket, string completionTicket,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<RemediationRunState> GetStateAsync(string runnerJobId, DateTime startedAfter,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();
    }

    private sealed class NoopJobScheduler : IJobScheduler
    {
        public void Enqueue<TJob>(string queue, Expression<Func<TJob, Task>> methodCall) { }

        public void Schedule<TJob>(string queue, Expression<Func<TJob, Task>> methodCall, TimeSpan delay) { }
    }

    private sealed class MergeRequestHost(string? mergeRequestUrl) : IRepositoryHostClient
    {
        public Task<RepositoryListing> ListUserRepositoriesAsync(string token, string platform,
            GitLabInstance gitLab, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<(string Id, string Login)?> GetAuthenticatedAccountAsync(string token, string platform,
            GitLabInstance gitLab, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<string?> GetHeadCommitAsync(string host, string owner, string repo, RepositoryAccess? access,
            string? branch, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<RepositoryBranchListing?> ListBranchesAsync(string host, string owner, string repo,
            RepositoryAccess? access, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<RepositoryFileListing> ListFilesAsync(string host, string owner, string repo,
            RepositoryAccess? access, string? commitSha, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<string?> FetchTextAsync(string host, string url, RepositoryAccess? access,
            CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<string?> FindMergeRequestUrlAsync(string host, string owner, string repo,
            RepositoryAccess access, string sourceBranch, CancellationToken cancellationToken) =>
            Task.FromResult(mergeRequestUrl);
    }
}
