using System.ComponentModel.DataAnnotations;

namespace Sentinel.Infrastructure.Email;

public class EmailSettings
{
    [Required(ErrorMessage = "Email:Host is required in the configuration")]
    public string Host { get; set; } = string.Empty;

    [Range(1, 65535, ErrorMessage = "Email:Port must be between 1 and 65535")]
    public int Port { get; set; } = 587;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email:FromAddress is required in the configuration")]
    [EmailAddress(ErrorMessage = "Email:FromAddress must be a valid email address")]
    public string FromAddress { get; set; } = string.Empty;

    public string FromName { get; set; } = "Sentinel";
}
