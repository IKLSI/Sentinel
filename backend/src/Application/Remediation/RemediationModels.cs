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
