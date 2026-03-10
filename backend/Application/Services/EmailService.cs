using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace TMAflow.Application.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        IConfigurationSection emailSettings = _configuration.GetSection("Email");
        string host = emailSettings["Host"]!;
        int port = int.Parse(emailSettings["Port"] ?? "587");
        string username = emailSettings["Username"] ?? string.Empty;
        string password = emailSettings["Password"] ?? string.Empty;
        string fromAddress = emailSettings["FromAddress"]!;
        string fromName = emailSettings["FromName"] ?? "TMAflow";

        MimeMessage message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromAddress));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;

        BodyBuilder bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = bodyBuilder.ToMessageBody();

        using SmtpClient client = new SmtpClient();

        try
        {
            await client.ConnectAsync(host, port, port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable);

            if (!string.IsNullOrEmpty(username))
            {
                await client.AuthenticateAsync(username, password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email envoyé à {Email} : {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'envoi de l'email à {Email}", toEmail);
            throw;
        }
    }

    public async Task SendSlaBreachAlertAsync(string toEmail, string toName, string ticketTitle, DateTime deadline)
    {
        string subject = $"[TMAflow] Alerte SLA : {ticketTitle}";
        string htmlBody = $@"
<html>
<body style='font-family: Arial, sans-serif; color: #333;'>
    <h2 style='color: #e74c3c;'>Alerte SLA</h2>
    <p>Le SLA du ticket suivant est dépassé ou sur le point de l'être :</p>
    <p>Ticket : <strong>{ticketTitle}</strong></p>
    <p>Échéance SLA : <strong>{deadline:dd/MM/yyyy HH:mm}</strong></p>
    <hr/>
    <p style='color: #666; font-size: 12px;'>TMAflow - Gestion TMA</p>
</body>
</html>";

        await SendEmailAsync(toEmail, toName, subject, htmlBody);
    }

    public async Task SendMonthlyReportAsync(string toEmail, string toName, string clientName, string period, byte[] pdfBytes)
    {
        string subject = $"[TMAflow] Rapport mensuel {clientName} - {period}";
        string htmlBody = $@"
<html>
<body style='font-family: Arial, sans-serif; color: #333;'>
    <h2>Rapport mensuel TMAflow</h2>
    <p>Bonjour {toName},</p>
    <p>Veuillez trouver en pièce jointe le rapport mensuel de <strong>{clientName}</strong> pour la période <strong>{period}</strong>.</p>
    <hr/>
    <p style='color: #666; font-size: 12px;'>TMAflow - Gestion TMA</p>
</body>
</html>";

        IConfigurationSection emailSettings = _configuration.GetSection("Email");
        string host = emailSettings["Host"]!;
        int port = int.Parse(emailSettings["Port"] ?? "587");
        string username = emailSettings["Username"] ?? string.Empty;
        string password = emailSettings["Password"] ?? string.Empty;
        string fromAddress = emailSettings["FromAddress"]!;
        string fromName = emailSettings["FromName"] ?? "TMAflow";

        MimeMessage message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromAddress));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;

        BodyBuilder bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
        bodyBuilder.Attachments.Add($"rapport_{clientName}_{period}.pdf", pdfBytes, ContentType.Parse("application/pdf"));
        message.Body = bodyBuilder.ToMessageBody();

        using SmtpClient client = new SmtpClient();
        await client.ConnectAsync(host, port, port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable);

        if (!string.IsNullOrEmpty(username))
        {
            await client.AuthenticateAsync(username, password);
        }

        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
