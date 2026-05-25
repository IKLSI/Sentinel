using System.Reflection;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public record VulnerabilityAlertEntry(string CveId, string PackageName, string Severity, decimal CvssScore, string? FixedVersion);

public interface IEmailService
{
    Task SendInvitationAsync(UserInvitation invitation, string organizationName, string invitedByName, string frontendBaseUrl);
    Task SendPasswordResetAsync(string email, string resetToken, string frontendBaseUrl);
    Task SendEmailVerificationAsync(string email, string verificationToken, string frontendBaseUrl);
    Task SendNewClientTicketToAdminsAsync(IEnumerable<string> adminEmails, string clientName, string ticketTitle, string organizationName, string eventLabel, string contentLabel, string contentPreview, string ticketUrl);
    Task SendVulnerabilityAlertAsync(IEnumerable<string> adminEmails, string projectName, string organizationName, string projectUrl, bool isFirstScan, IReadOnlyList<VulnerabilityAlertEntry> newVulns);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendInvitationAsync(UserInvitation invitation, string organizationName, string invitedByName, string frontendBaseUrl)
    {
        string acceptUrl  = $"{frontendBaseUrl}/accept-invitation?token={invitation.Token}";
        string roleLabel = invitation.Role == UserRole.Admin ? "Administrateur" : "Développeur";
        string roleColor = invitation.Role == UserRole.Admin ? "#dc2626" : "#4f46e5";
        string roleBg    = invitation.Role == UserRole.Admin ? "#fef2f2" : "#eef2ff";

        string html = LoadTemplate("invitation.html")
            .Replace("{{EMAIL}}",        invitation.Email)
            .Replace("{{INVITED_BY}}",   invitedByName)
            .Replace("{{ORGANIZATION}}", organizationName)
            .Replace("{{ROLE_LABEL}}",   roleLabel)
            .Replace("{{ROLE_COLOR}}",   roleColor)
            .Replace("{{ROLE_BG}}",      roleBg)
            .Replace("{{ACCEPT_URL}}",   acceptUrl);

        MimeMessage message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _configuration["Email:FromName"] ?? "Sentinel",
            _configuration["Email:FromAddress"] ?? "noreply@sentinel.io"
        ));
        message.To.Add(new MailboxAddress(invitation.Email, invitation.Email));
        message.Subject = $"Invitation à rejoindre {organizationName} sur Sentinel";
        message.Body = new BodyBuilder
        {
            HtmlBody = html,
            TextBody = BuildTextFallback(invitedByName, organizationName, roleLabel, acceptUrl)
        }.ToMessageBody();

        using SmtpClient client = new SmtpClient();

        string host     = _configuration["Email:Host"] ?? throw new InvalidOperationException("Email:Host manquant");
        int    port     = int.Parse(_configuration["Email:Port"] ?? "587");
        string username = _configuration["Email:Username"] ?? string.Empty;
        string password = _configuration["Email:Password"] ?? string.Empty;

        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);

        if (!string.IsNullOrEmpty(username))
            await client.AuthenticateAsync(username, password);

        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation("Email d'invitation envoyé à {Email}", invitation.Email);
    }

    public async Task SendPasswordResetAsync(string email, string resetToken, string frontendBaseUrl)
    {
        string resetUrl = $"{frontendBaseUrl}/reset-password?token={resetToken}";

        string html = LoadTemplate("password-reset.html")
            .Replace("{{EMAIL}}", email)
            .Replace("{{RESET_URL}}", resetUrl);

        MimeMessage message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _configuration["Email:FromName"] ?? "Sentinel",
            _configuration["Email:FromAddress"] ?? "noreply@sentinel.io"
        ));
        message.To.Add(new MailboxAddress(email, email));
        message.Subject = "Réinitialisation de votre mot de passe Sentinel";
        message.Body = new BodyBuilder
        {
            HtmlBody = html,
            TextBody = $"""
                Réinitialisation de votre mot de passe Sentinel

                Vous avez demandé la réinitialisation de votre mot de passe.

                Lien de réinitialisation : {resetUrl}

                Ce lien expire dans 1 heure.

                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
                """
        }.ToMessageBody();

        using SmtpClient client = new SmtpClient();

        string host     = _configuration["Email:Host"] ?? throw new InvalidOperationException("Email:Host manquant");
        int    port     = int.Parse(_configuration["Email:Port"] ?? "587");
        string username = _configuration["Email:Username"] ?? string.Empty;
        string password = _configuration["Email:Password"] ?? string.Empty;

        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);

        if (!string.IsNullOrEmpty(username))
            await client.AuthenticateAsync(username, password);

        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation("Email de réinitialisation de mot de passe envoyé à {Email}", email);
    }

    public async Task SendEmailVerificationAsync(string email, string verificationToken, string frontendBaseUrl)
    {
        string verifyUrl = $"{frontendBaseUrl}/verify-email?token={verificationToken}";

        string html = LoadTemplate("email-verification.html")
            .Replace("{{EMAIL}}", email)
            .Replace("{{VERIFY_URL}}", verifyUrl);

        MimeMessage message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _configuration["Email:FromName"] ?? "Sentinel",
            _configuration["Email:FromAddress"] ?? "noreply@sentinel.io"
        ));
        message.To.Add(new MailboxAddress(email, email));
        message.Subject = "Confirmez votre adresse email Sentinel";
        message.Body = new BodyBuilder
        {
            HtmlBody = html,
            TextBody = $"""
                Bienvenue sur Sentinel

                Confirmez votre adresse email pour activer votre compte.

                Lien d'activation : {verifyUrl}

                Ce lien expire dans 48 heures.

                Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
                """
        }.ToMessageBody();

        using SmtpClient client = new SmtpClient();

        string host     = _configuration["Email:Host"] ?? throw new InvalidOperationException("Email:Host manquant");
        int    port     = int.Parse(_configuration["Email:Port"] ?? "587");
        string username = _configuration["Email:Username"] ?? string.Empty;
        string password = _configuration["Email:Password"] ?? string.Empty;

        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);

        if (!string.IsNullOrEmpty(username))
            await client.AuthenticateAsync(username, password);

        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation("Email de vérification envoyé à {Email}", email);
    }

    public async Task SendNewClientTicketToAdminsAsync(IEnumerable<string> adminEmails, string clientName, string ticketTitle, string organizationName, string eventLabel, string contentLabel, string contentPreview, string ticketUrl)
    {
        string html = LoadTemplate("ticket-admin-new.html")
            .Replace("{{CLIENT_NAME}}", clientName)
            .Replace("{{TICKET_TITLE}}", ticketTitle)
            .Replace("{{ORGANIZATION}}", organizationName)
            .Replace("{{EVENT_LABEL}}", eventLabel)
            .Replace("{{CONTENT_LABEL}}", contentLabel)
            .Replace("{{CONTENT_PREVIEW}}", contentPreview)
            .Replace("{{TICKET_URL}}", ticketUrl);

        foreach (string adminEmail in adminEmails)
        {
            MimeMessage message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["Email:FromName"] ?? "Sentinel",
                _configuration["Email:FromAddress"] ?? "noreply@sentinel.io"
            ));
            message.To.Add(new MailboxAddress(adminEmail, adminEmail));
            message.Subject = $"[{organizationName}] {eventLabel} — {ticketTitle}";
            message.Body = new BodyBuilder { HtmlBody = html }.ToMessageBody();

            using SmtpClient client = new SmtpClient();
            string host     = _configuration["Email:Host"] ?? throw new InvalidOperationException("Email:Host manquant");
            int    port     = int.Parse(_configuration["Email:Port"] ?? "587");
            string username = _configuration["Email:Username"] ?? string.Empty;
            string password = _configuration["Email:Password"] ?? string.Empty;
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            if (!string.IsNullOrEmpty(username))
                await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Notification admin envoyée à {Email} pour ticket client", adminEmail);
        }
    }

    public async Task SendVulnerabilityAlertAsync(IEnumerable<string> adminEmails, string projectName, string organizationName, string projectUrl, bool isFirstScan, IReadOnlyList<VulnerabilityAlertEntry> newVulns)
    {
        string scanLabel = isFirstScan ? "Premier scan — vulnérabilités détectées" : "Nouvelles vulnérabilités détectées";
        int critical = newVulns.Count(v => v.Severity == "Critical");
        int high = newVulns.Count(v => v.Severity == "High");
        int medium = newVulns.Count(v => v.Severity == "Medium");
        int low = newVulns.Count(v => v.Severity == "Low");

        string vulnRows = string.Join("\n", newVulns.Take(15).Select(v =>
        {
            (string color, string bg, string border) = v.Severity switch
            {
                "Critical" => ("#dc2626", "#fef2f2", "#fbd2d2"),
                "High"     => ("#ea580c", "#fff7ed", "#fed8b4"),
                "Medium"   => ("#ca8a04", "#fefce8", "#fae9b0"),
                _          => ("#475569", "#f1f5f9", "#dde3ec")
            };
            string fix = string.IsNullOrEmpty(v.FixedVersion) ? "" : $" &rarr; fix : <span style=\"color:#059669;font-weight:700;\">{v.FixedVersion}</span>";
            return $"""<p style="margin:0 0 10px;font-size:13px;color:#64748b;line-height:1.6;"><span style="display:inline-block;padding:2px 8px;border-radius:4px;background-color:{bg};border:1px solid {border};color:{color};font-size:11px;font-weight:700;margin-right:8px;">{v.Severity}</span><span style="color:#0f172a;font-weight:700;">{v.PackageName}</span> &mdash; <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:12px;color:#64748b;">{v.CveId}</span> (CVSS {v.CvssScore:F1}){fix}</p>""";
        }));

        if (newVulns.Count > 15)
            vulnRows += $"""<p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">... et {newVulns.Count - 15} autre(s)</p>""";

        string html = LoadTemplate("vuln-alert.html")
            .Replace("{{PROJECT_NAME}}", projectName)
            .Replace("{{ORGANIZATION}}", organizationName)
            .Replace("{{SCAN_LABEL}}", scanLabel)
            .Replace("{{NEW_COUNT}}", newVulns.Count.ToString())
            .Replace("{{COUNT_CRITICAL}}", critical.ToString())
            .Replace("{{COUNT_HIGH}}", high.ToString())
            .Replace("{{COUNT_MEDIUM}}", medium.ToString())
            .Replace("{{COUNT_LOW}}", low.ToString())
            .Replace("{{VULN_ROWS}}", vulnRows)
            .Replace("{{PROJECT_URL}}", projectUrl);

        string subject = isFirstScan
            ? $"[{organizationName}] {projectName} — {newVulns.Count} vulnérabilité(s) détectée(s)"
            : $"[{organizationName}] {projectName} — {newVulns.Count} nouvelle(s) vulnérabilité(s)";

        string host     = _configuration["Email:Host"] ?? throw new InvalidOperationException("Email:Host manquant");
        int    port     = int.Parse(_configuration["Email:Port"] ?? "587");
        string username = _configuration["Email:Username"] ?? string.Empty;
        string password = _configuration["Email:Password"] ?? string.Empty;

        foreach (string adminEmail in adminEmails)
        {
            MimeMessage message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["Email:FromName"] ?? "Sentinel",
                _configuration["Email:FromAddress"] ?? "noreply@sentinel.io"
            ));
            message.To.Add(new MailboxAddress(adminEmail, adminEmail));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = html }.ToMessageBody();

            using SmtpClient client = new SmtpClient();
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            if (!string.IsNullOrEmpty(username))
                await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Alerte vulnérabilités envoyée à {Email} pour projet {Project}", adminEmail, projectName);
        }
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

    private static string BuildTextFallback(string invitedByName, string organizationName, string roleLabel, string acceptUrl) => $"""
        Invitation à rejoindre {organizationName} sur Sentinel

        {invitedByName} vous a ajouté à l'espace de travail {organizationName}.
        Rôle : {roleLabel}

        Accepter l'invitation : {acceptUrl}

        Ce lien expire dans 48 heures.
        """;
}
