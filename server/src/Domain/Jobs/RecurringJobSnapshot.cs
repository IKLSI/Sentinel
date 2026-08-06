namespace Sentinel.Domain.Jobs;

public sealed record RecurringJobSnapshot(
    string Id,
    string? LastJobState,
    DateTime? LastExecution,
    DateTime? NextExecution,
    string? Error);
