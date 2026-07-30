using Sentinel.Domain.Models;

namespace Sentinel.Domain.Abstractions;

public record VulnerabilityAlertEntry(
    string CveId,
    string PackageName,
    string Severity,
    decimal CvssScore,
    string? FixedVersion);

public record EmailRecipient(string Email, string Culture);

public interface IEmailService
{
    Task SendInvitationAsync(UserInvitation invitation, string rawToken, string organizationName,
        string invitedByName, string frontendBaseUrl, string culture);

    Task SendExistingAccountNoticeAsync(string email, string frontendBaseUrl, string culture);

    Task SendPasswordResetAsync(string email, string resetToken, string frontendBaseUrl, string culture);

    Task SendEmailVerificationAsync(string email, string verificationToken, string frontendBaseUrl, string culture);

    Task SendVulnerabilityAlertAsync(IReadOnlyList<EmailRecipient> recipients, string projectName,
        string organizationName, string projectUrl, bool isFirstScan, IReadOnlyList<VulnerabilityAlertEntry> newVulns);

    Task SendSubscriptionCanceledAsync(IReadOnlyList<EmailRecipient> recipients, string organizationName,
        string billingUrl);

    Task SendSubscriptionUpdatedAsync(IReadOnlyList<EmailRecipient> recipients, string organizationName,
        string oldPlan, string newPlan, string statusKey, string statusValue, string billingUrl);
}
