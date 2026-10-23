using System.Security.Cryptography;
using System.Text;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.Remediation.CompleteRemediationRun;

public class CompleteRemediationRunService(
    IVulnerabilityRemediationRepository remediationRepository,
    RemediationRunJob remediationRunJob,
    ISystemScope systemScope) : IService
{
    public async Task<Result> ExecuteAsync(Guid remediationId, string? completionTicket,
        CompleteRemediationRunDto model, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(completionTicket))
            return Result.Unauthorized(ErrorCodes.RemediationTicketInvalid);

        using (systemScope.Enter())
        {
            VulnerabilityRemediation? remediation = await remediationRepository.GetOrDefaultAsync(remediationId,
                QueryTracking.NoTracking, cancellationToken);

            if (remediation == null || !AcceptsTicket(remediation, completionTicket))
                return Result.Unauthorized(ErrorCodes.RemediationTicketInvalid);
        }

        await remediationRunJob.CompleteAsync(remediationId,
            model.Succeeded ? RemediationRunState.Succeeded : RemediationRunState.Failed, cancellationToken);

        return Result.NoContent();
    }

    private static bool AcceptsTicket(VulnerabilityRemediation remediation, string completionTicket) =>
        remediation is { Status: RemediationStatus.Running, CompletionTicketHash: not null }
        && CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(remediation.CompletionTicketHash),
            Encoding.UTF8.GetBytes(SecureToken.Hash(completionTicket)));
}
