using System.Net;
using System.Reflection;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Models;
using Sentinel.Domain.Settings;

namespace Sentinel.Infrastructure.Email;


public class EmailService : IEmailService
{
    private readonly EmailSettings _email;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailOptions, ILogger<EmailService> logger)
    {
        _email = emailOptions.Value;
        _logger = logger;
    }

    public async Task SendInvitationAsync(UserInvitation invitation, string rawToken, string organizationName, string invitedByName, string frontendBaseUrl)
    {
        string acceptUrl  = $"{frontendBaseUrl}/accept-invitation?token={rawToken}";
        string roleLabel = invitation.Role == UserRole.Admin ? "Administrateur" : "Développeur";
        string roleColor = invitation.Role == UserRole.Admin ? "#dc2626" : "#4f46e5";
        string roleBg    = invitation.Role == UserRole.Admin ? "#fef2f2" : "#eef2ff";

        string html = RenderTemplate("invitation.html", new Dictionary<string, string>
        {
            ["{{EMAIL}}"]        = invitation.Email,
            ["{{INVITED_BY}}"]   = invitedByName,
            ["{{ORGANIZATION}}"] = organizationName,
            ["{{ROLE_LABEL}}"]   = roleLabel,
            ["{{ROLE_COLOR}}"]   = roleColor,
            ["{{ROLE_BG}}"]      = roleBg,
            ["{{ACCEPT_URL}}"]   = acceptUrl
        });

        MimeMessage message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _email.FromName,
            _email.FromAddress
        ));
        message.To.Add(new MailboxAddress(invitation.Email, invitation.Email));
        message.Subject = $"Invitation à rejoindre {organizationName} sur Sentinel";
        message.Body = new BodyBuilder
        {
            HtmlBody = html,
            TextBody = BuildTextFallback(invitedByName, organizationName, roleLabel, acceptUrl)
        }.ToMessageBody();

        using SmtpClient client = new SmtpClient();

        string host     = string.IsNullOrEmpty(_email.Host) ? throw new InvalidOperationException("Email:Host manquant") : _email.Host;
        int    port     = _email.Port;
        string username = _email.Username;
        string password = _email.Password;

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

        string html = RenderTemplate("password-reset.html", new Dictionary<string, string>
        {
            ["{{EMAIL}}"]     = email,
            ["{{RESET_URL}}"] = resetUrl
        });

        MimeMessage message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _email.FromName,
            _email.FromAddress
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

        string host     = string.IsNullOrEmpty(_email.Host) ? throw new InvalidOperationException("Email:Host manquant") : _email.Host;
        int    port     = _email.Port;
        string username = _email.Username;
        string password = _email.Password;

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

        string html = RenderTemplate("email-verification.html", new Dictionary<string, string>
        {
            ["{{EMAIL}}"]      = email,
            ["{{VERIFY_URL}}"] = verifyUrl
        });

        MimeMessage message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            _email.FromName,
            _email.FromAddress
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

        string host     = string.IsNullOrEmpty(_email.Host) ? throw new InvalidOperationException("Email:Host manquant") : _email.Host;
        int    port     = _email.Port;
        string username = _email.Username;
        string password = _email.Password;

        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);

        if (!string.IsNullOrEmpty(username))
            await client.AuthenticateAsync(username, password);

        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation("Email de vérification envoyé à {Email}", email);
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
            string fix = string.IsNullOrEmpty(v.FixedVersion) ? "" : $" &rarr; fix : <span style=\"color:#059669;font-weight:700;\">{WebUtility.HtmlEncode(v.FixedVersion)}</span>";
            return $"""<p style="margin:0 0 10px;font-size:13px;color:#64748b;line-height:1.6;"><span style="display:inline-block;padding:2px 8px;border-radius:4px;background-color:{bg};border:1px solid {border};color:{color};font-size:11px;font-weight:700;margin-right:8px;">{WebUtility.HtmlEncode(v.Severity)}</span><span style="color:#0f172a;font-weight:700;">{WebUtility.HtmlEncode(v.PackageName)}</span> &mdash; <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:12px;color:#64748b;">{WebUtility.HtmlEncode(v.CveId)}</span> (CVSS {v.CvssScore:F1}){fix}</p>""";
        }));

        if (newVulns.Count > 15)
            vulnRows += $"""<p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">... et {newVulns.Count - 15} autre(s)</p>""";

        string html = RenderTemplate("vuln-alert.html",
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

        string subject = isFirstScan
            ? $"[{organizationName}] {projectName} — {newVulns.Count} vulnérabilité(s) détectée(s)"
            : $"[{organizationName}] {projectName} — {newVulns.Count} nouvelle(s) vulnérabilité(s)";

        string host     = string.IsNullOrEmpty(_email.Host) ? throw new InvalidOperationException("Email:Host manquant") : _email.Host;
        int    port     = _email.Port;
        string username = _email.Username;
        string password = _email.Password;

        foreach (string adminEmail in adminEmails)
        {
            MimeMessage message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _email.FromName,
                _email.FromAddress
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

    public async Task SendSubscriptionCanceledAsync(IEnumerable<string> adminEmails, string organizationName, string billingUrl)
    {
        string html = RenderTemplate("subscription-canceled.html", new Dictionary<string, string>
        {
            ["{{ORGANIZATION}}"] = organizationName,
            ["{{BILLING_URL}}"]  = billingUrl
        });

        string host     = string.IsNullOrEmpty(_email.Host) ? throw new InvalidOperationException("Email:Host manquant") : _email.Host;
        int    port     = _email.Port;
        string username = _email.Username;
        string password = _email.Password;

        foreach (string adminEmail in adminEmails)
        {
            MimeMessage message = new MimeMessage();
            message.From.Add(new MailboxAddress(_email.FromName, _email.FromAddress));
            message.To.Add(new MailboxAddress(adminEmail, adminEmail));
            message.Subject = $"[{organizationName}] Abonnement annulé — retour au plan gratuit";
            message.Body = new BodyBuilder { HtmlBody = html }.ToMessageBody();

            using SmtpClient client = new SmtpClient();
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            if (!string.IsNullOrEmpty(username))
                await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Notification annulation abonnement envoyée à {Email}", adminEmail);
        }
    }

    public async Task SendSubscriptionUpdatedAsync(IEnumerable<string> adminEmails, string organizationName, string oldPlan, string newPlan, string statusMessage, string billingUrl)
    {
        string html = RenderTemplate("subscription-updated.html", new Dictionary<string, string>
        {
            ["{{ORGANIZATION}}"]   = organizationName,
            ["{{OLD_PLAN}}"]       = oldPlan,
            ["{{NEW_PLAN}}"]       = newPlan,
            ["{{STATUS_MESSAGE}}"] = statusMessage,
            ["{{BILLING_URL}}"]    = billingUrl
        });

        string host     = string.IsNullOrEmpty(_email.Host) ? throw new InvalidOperationException("Email:Host manquant") : _email.Host;
        int    port     = _email.Port;
        string username = _email.Username;
        string password = _email.Password;

        foreach (string adminEmail in adminEmails)
        {
            MimeMessage message = new MimeMessage();
            message.From.Add(new MailboxAddress(_email.FromName, _email.FromAddress));
            message.To.Add(new MailboxAddress(adminEmail, adminEmail));
            message.Subject = $"[{organizationName}] Abonnement mis à jour — {oldPlan} → {newPlan}";
            message.Body = new BodyBuilder { HtmlBody = html }.ToMessageBody();

            using SmtpClient client = new SmtpClient();
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            if (!string.IsNullOrEmpty(username))
                await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Notification changement abonnement envoyée à {Email} ({OldPlan} → {NewPlan})", adminEmail, oldPlan, newPlan);
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

    private static string RenderTemplate(
        string fileName,
        IReadOnlyDictionary<string, string> values,
        IReadOnlyDictionary<string, string>? preRenderedHtml = null)
    {
        string template = LoadTemplate(fileName);

        foreach ((string placeholder, string value) in values)
            template = template.Replace(placeholder, WebUtility.HtmlEncode(value));

        if (preRenderedHtml is not null)
        {
            foreach ((string placeholder, string html) in preRenderedHtml)
                template = template.Replace(placeholder, html);
        }

        return template;
    }

    private static string BuildTextFallback(string invitedByName, string organizationName, string roleLabel, string acceptUrl) => $"""
        Invitation à rejoindre {organizationName} sur Sentinel

        {invitedByName} vous a ajouté à l'espace de travail {organizationName}.
        Rôle : {roleLabel}

        Accepter l'invitation : {acceptUrl}

        Ce lien expire dans 48 heures.
        """;
}
