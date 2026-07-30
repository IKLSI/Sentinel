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
public partial class RemediationService
{
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
