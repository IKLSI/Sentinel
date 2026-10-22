namespace Sentinel.Domain.Abstractions;

public enum RemediationRunState
{
    Pending,
    Running,
    Succeeded,
    Failed,
    Unknown
}

public interface IRemediationRunner
{
    bool IsConfigured { get; }

    Task<string?> StartAsync(Guid remediationId, string configTicket, CancellationToken cancellationToken);

    Task<RemediationRunState> GetStateAsync(string runnerJobId, DateTime startedAfter,
        CancellationToken cancellationToken);
}
