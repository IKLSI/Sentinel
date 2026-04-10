using System.Reflection;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public interface IEmailService
{
    Task SendInvitationAsync(UserInvitation invitation, string organizationName, string invitedByName, string frontendBaseUrl);
    Task SendPasswordResetAsync(string email, string resetToken, string frontendBaseUrl);
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
        string roleColor = invitation.Role == UserRole.Admin ? "#f87171" : "#818cf8";
        string roleBg    = invitation.Role == UserRole.Admin ? "#2d1515" : "#1a1a35";

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
