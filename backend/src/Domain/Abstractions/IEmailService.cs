using Sentinel.Domain.Models;

namespace Sentinel.Domain.Abstractions;

public record VulnerabilityAlertEntry(
    string CveId,
    string PackageName,
    string Severity,
    decimal CvssScore,
    string? FixedVersion);

public interface IEmailService
{
    Task SendInvitationAsync(UserInvitation invitation, string rawToken, string organizationName,
        string invitedByName, string frontendBaseUrl);

    Task SendPasswordResetAsync(string email, string resetToken, string frontendBaseUrl);

    Task SendEmailVerificationAsync(string email, string verificationToken, string frontendBaseUrl);

    Task SendVulnerabilityAlertAsync(IEnumerable<string> adminEmails, string projectName, string organizationName,
        string projectUrl, bool isFirstScan, IReadOnlyList<VulnerabilityAlertEntry> newVulns);

    Task SendSubscriptionCanceledAsync(IEnumerable<string> adminEmails, string organizationName, string billingUrl);

    Task SendSubscriptionUpdatedAsync(IEnumerable<string> adminEmails, string organizationName, string oldPlan,
        string newPlan, string statusMessage, string billingUrl);
}
