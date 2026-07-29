using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.Settings;

public class EmailSettings
{
    [Required(ErrorMessage = "Email:Host est requis dans la configuration")]
    public string Host { get; set; } = string.Empty;

    [Range(1, 65535, ErrorMessage = "Email:Port doit être compris entre 1 et 65535")]
    public int Port { get; set; } = 587;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email:FromAddress est requis dans la configuration")]
    [EmailAddress(ErrorMessage = "Email:FromAddress doit être une adresse email valide")]
    public string FromAddress { get; set; } = string.Empty;

    public string FromName { get; set; } = "Sentinel";
}
