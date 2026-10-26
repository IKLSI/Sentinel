using System.Globalization;
using System.Net;
using System.Reflection;
using System.Text.RegularExpressions;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Infrastructure.Email;


public partial class EmailService : IEmailService
{
    private const int ImplicitTlsPort = 465;

    private readonly EmailSettings _email;
    private readonly ILocalizer _localizer;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailOptions, ILocalizer localizer, ILogger<EmailService> logger)
    {
        _email = emailOptions.Value;
        _localizer = localizer;
        _logger = logger;
    }

    public async Task SendInvitationAsync(UserInvitation invitation, string rawToken, string organizationName, string invitedByName, string frontendBaseUrl, string culture,
        CancellationToken cancellationToken)
    {
        string acceptUrl  = $"{frontendBaseUrl}/accept-invitation?token={rawToken}";
        string roleLabel = invitation.Role == UserRole.Admin
            ? Text(culture, "emails.role.admin")
            : Text(culture, "emails.role.developer");
        string roleColor = invitation.Role == UserRole.Admin ? "#dc2626" : "#4f46e5";
        string roleBg    = invitation.Role == UserRole.Admin ? "#fef2f2" : "#eef2ff";

        string html = RenderTemplate("invitation.html", culture, new Dictionary<string, string>
        {
            ["{{EMAIL}}"]        = invitation.Email,
            ["{{INVITED_BY}}"]   = invitedByName,
            ["{{ORGANIZATION}}"] = organizationName,
            ["{{ROLE_LABEL}}"]   = roleLabel,
            ["{{ROLE_COLOR}}"]   = roleColor,
            ["{{ROLE_BG}}"]      = roleBg,
            ["{{ACCEPT_URL}}"]   = acceptUrl
        });

        MimeMessage message = BuildMessage(invitation.Email,
            Text(culture, "emails.invitation.subject",
                new Dictionary<string, string> { ["organization"] = organizationName }),
            html,
            Text(culture, "emails.invitation.text_body", new Dictionary<string, string>
            {
                ["organization"] = organizationName,
                ["invitedBy"] = invitedByName,
                ["role"] = roleLabel,
                ["url"] = acceptUrl
            }));

        await SendAsync(message, invitation.Email, "Invitation email", cancellationToken);
    }

    public async Task SendExistingAccountNoticeAsync(string email, string frontendBaseUrl, string culture,
        CancellationToken cancellationToken)
    {
        string loginUrl = $"{frontendBaseUrl}/login";

        string html = RenderTemplate("invitation-existing-account.html", culture, new Dictionary<string, string>
        {
            ["{{EMAIL}}"]     = email,
            ["{{LOGIN_URL}}"] = loginUrl
        });

        MimeMessage message = BuildMessage(email, Text(culture, "emails.existing_account.subject"), html,
            Text(culture, "emails.existing_account.text_body", new Dictionary<string, string>
            {
                ["email"] = email,
                ["url"] = loginUrl
            }));

        await SendAsync(message, email, "Existing account notification", cancellationToken);
    }

    public async Task SendPasswordResetAsync(string email, string resetToken, string frontendBaseUrl, string culture,
        CancellationToken cancellationToken)
    {
        string resetUrl = $"{frontendBaseUrl}/reset-password?token={resetToken}";

        string html = RenderTemplate("password-reset.html", culture, new Dictionary<string, string>
        {
            ["{{EMAIL}}"]     = email,
            ["{{RESET_URL}}"] = resetUrl
        });

        MimeMessage message = BuildMessage(email, Text(culture, "emails.password_reset.subject"), html,
            Text(culture, "emails.password_reset.text_body", new Dictionary<string, string> { ["url"] = resetUrl }));

        await SendAsync(message, email, "Password reset email", cancellationToken);
    }

    public async Task SendEmailVerificationAsync(string email, string verificationToken, string frontendBaseUrl, string culture,
        CancellationToken cancellationToken)
    {
        string verifyUrl = $"{frontendBaseUrl}/verify-email?token={verificationToken}";

        string html = RenderTemplate("email-verification.html", culture, new Dictionary<string, string>
        {
            ["{{EMAIL}}"]      = email,
            ["{{VERIFY_URL}}"] = verifyUrl
        });

        MimeMessage message = BuildMessage(email, Text(culture, "emails.verification.subject"), html,
            Text(culture, "emails.verification.text_body", new Dictionary<string, string> { ["url"] = verifyUrl }));

        await SendAsync(message, email, "Verification email", cancellationToken);
    }

    public async Task SendAccountSuspendedAsync(string email, string organizationName, string culture,
        CancellationToken cancellationToken)
    {
        string html = RenderTemplate("account-suspended.html", culture, new Dictionary<string, string>
        {
            ["{{ORGANIZATION}}"] = organizationName
        });

        Dictionary<string, string> organizationValues = new() { ["organization"] = organizationName };

        MimeMessage message = BuildMessage(email, Text(culture, "emails.account_suspended.subject", organizationValues),
            html, Text(culture, "emails.account_suspended.text_body", organizationValues));

        await SendAsync(message, email, "Account suspension email", cancellationToken);
    }

    public async Task SendVulnerabilityAlertAsync(IReadOnlyList<EmailRecipient> recipients, string projectName, string organizationName, string projectUrl, bool isFirstScan, IReadOnlyList<VulnerabilityAlertEntry> newVulns,
        CancellationToken cancellationToken)
    {
        int critical = newVulns.Count(v => v.Severity == "Critical");
        int high = newVulns.Count(v => v.Severity == "High");
        int medium = newVulns.Count(v => v.Severity == "Medium");
        int low = newVulns.Count(v => v.Severity == "Low");

        foreach (EmailRecipient recipient in recipients)
        {
            string culture = recipient.Culture;

            string scanLabel = isFirstScan
                ? Text(culture, "emails.vuln_alert.scan_first")
                : Text(culture, "emails.vuln_alert.scan_new");

            string vulnRows = BuildVulnerabilityRows(newVulns, culture);

            string html = RenderTemplate("vuln-alert.html", culture,
                new Dictionary<string, string>
                {
                    ["{{PROJECT_NAME}}"]   = projectName,
                    ["{{ORGANIZATION}}"]   = organizationName,
                    ["{{SCAN_LABEL}}"]     = scanLabel,
                    ["{{NEW_COUNT}}"]      = newVulns.Count.ToString(),
                    ["{{COUNT_CRITICAL}}"] = critical.ToString(),
                    ["{{COUNT_HIGH}}"]     = high.ToString(),
                    ["{{COUNT_MEDIUM}}"]   = medium.ToString(),
                    ["{{COUNT_LOW}}"]      = low.ToString(),
                    ["{{PROJECT_URL}}"]    = projectUrl
                },
                new Dictionary<string, string>
                {
                    ["{{VULN_ROWS}}"] = vulnRows
                });

            string subject = Text(culture,
                isFirstScan ? "emails.vuln_alert.subject_first" : "emails.vuln_alert.subject_new",
                new Dictionary<string, string>
                {
                    ["organization"] = organizationName,
                    ["project"] = projectName,
                    ["count"] = newVulns.Count.ToString()
                });

            await DeliverAsync(BuildMessage(recipient.Email, subject, html), cancellationToken);

            _logger.LogInformation("Vulnerability alert sent to {Email} for project {Project}", MaskEmail(recipient.Email), projectName);
        }
    }

    private MimeMessage BuildMessage(string recipient, string subject, string htmlBody, string? textBody = null)
    {
        MimeMessage message = new MimeMessage();
        message.From.Add(new MailboxAddress(_email.FromName, _email.FromAddress));
        message.To.Add(new MailboxAddress(recipient, recipient));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody, TextBody = textBody }.ToMessageBody();

        return message;
    }

    private string BuildVulnerabilityRows(IReadOnlyList<VulnerabilityAlertEntry> newVulns, string culture)
    {
        string rows = string.Join("\n", newVulns.Take(15).Select(v =>
        {
            (string color, string bg, string border) = v.Severity switch
            {
                "Critical" => ("#b91c1c", "#fef2f2", "#f6c9c9"),
                "High"     => ("#c2410c", "#fff7ed", "#fcd7ae"),
                "Medium"   => ("#a16207", "#fefce8", "#f7e8a8"),
                _          => ("#5c6f90", "#eef1f9", "#d8e0ee")
            };
            string severityLabel = v.Severity switch
            {
                "Critical" => Text(culture, "emails.severity.critical"),
                "High"     => Text(culture, "emails.severity.high"),
                "Medium"   => Text(culture, "emails.severity.medium"),
                "Low"      => Text(culture, "emails.severity.low"),
                _          => v.Severity
            };
            string fixLabel = Text(culture, "emails.vuln_alert.fix");
            string fix = string.IsNullOrEmpty(v.FixedVersion) ? "" : $"""<tr><td style="padding-top:6px;font-size:12px;color:#5c6f90;">&rarr; {WebUtility.HtmlEncode(fixLabel)} : <span style="color:#16a34a;font-weight:700;font-family:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;">{WebUtility.HtmlEncode(v.FixedVersion)}</span></td></tr>""";
            return $"""
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;background-color:{bg};border:1px solid {border};border-radius:10px;">
                  <tr>
                    <td style="padding:12px 16px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <span style="display:inline-block;padding:3px 8px;border-radius:6px;background-color:#ffffff;border:1px solid {border};color:{color};font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-family:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;margin-right:8px;">{WebUtility.HtmlEncode(severityLabel)}</span>
                            <span style="color:#0e1220;font-weight:700;font-size:13px;">{WebUtility.HtmlEncode(v.PackageName)}</span>
                          </td>
                          <td align="right" style="font-family:'JetBrains Mono','SF Mono',Menlo,Consolas,monospace;font-size:11.5px;color:#5c6f90;white-space:nowrap;">{WebUtility.HtmlEncode(v.CveId)} &middot; CVSS {v.CvssScore.ToString("F1", CultureInfo.InvariantCulture)}</td>
                        </tr>
                        {fix}
                      </table>
                    </td>
                  </tr>
                </table>
                """;
        }));

        if (newVulns.Count > 15)
        {
            string more = Text(culture, "emails.vuln_alert.more",
                new Dictionary<string, string> { ["count"] = (newVulns.Count - 15).ToString() });
            rows += $"""<p style="margin:12px 0 0;font-size:12px;color:#8898bb;">{WebUtility.HtmlEncode(more)}</p>""";
        }

        return rows;
    }

    private async Task SendAsync(MimeMessage message, string recipient, string logLabel,
        CancellationToken cancellationToken)
    {
        await DeliverAsync(message, cancellationToken);

        _logger.LogInformation("{EmailKind:l} sent to {Email}", logLabel, MaskEmail(recipient));
    }

    private async Task DeliverAsync(MimeMessage message, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_email.Host)) throw new InvalidOperationException("Email:Host is missing");

        using SmtpClient client = new SmtpClient();

        await client.ConnectAsync(_email.Host, _email.Port, SocketOptionsFor(_email.Port), cancellationToken);

        if (!string.IsNullOrEmpty(_email.Username))
            await client.AuthenticateAsync(_email.Username, _email.Password, cancellationToken);

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    internal static SecureSocketOptions SocketOptionsFor(int port) =>
        port == ImplicitTlsPort ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;

    private string Text(string culture, string key) => _localizer.Get(culture, key);

    private string Text(string culture, string key, IReadOnlyDictionary<string, string> parameters) =>
        _localizer.Get(culture, key, parameters);

    private static string MaskEmail(string email)
    {
        int at = email.IndexOf('@');

        return at <= 0 ? "***" : $"{email[0]}***{email[at..]}";
    }

    private static string LoadTemplate(string fileName)
    {
        Assembly assembly = Assembly.GetExecutingAssembly();
        string resourceName = assembly.GetManifestResourceNames()
            .First(n => n.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));

        using Stream stream = assembly.GetManifestResourceStream(resourceName)!;
        using StreamReader reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    private string RenderTemplate(
        string fileName,
        string culture,
        IReadOnlyDictionary<string, string> values,
        IReadOnlyDictionary<string, string>? preRenderedHtml = null)
    {
        string template = LoadTemplate(fileName);

        template = TranslationToken().Replace(template, match => Text(culture, match.Groups[1].Value));

        foreach ((string placeholder, string value) in values)
            template = template.Replace(placeholder, WebUtility.HtmlEncode(value));

        if (preRenderedHtml is not null)
        {
            foreach ((string placeholder, string html) in preRenderedHtml)
                template = template.Replace(placeholder, html);
        }

        return template;
    }

    [GeneratedRegex(@"\{\{T:([A-Za-z0-9_.]+)\}\}")]
    private static partial Regex TranslationToken();
}
