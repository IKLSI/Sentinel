using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.DTOs.Tickets;

public class TicketStatusDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsDefault { get; set; }
    public bool IsClosed { get; set; }
    public int TicketCount { get; set; }
}

public class CreateTicketStatusDto
{
    [Required(ErrorMessage = "Le nom du statut est requis")]
    [MaxLength(50, ErrorMessage = "Le nom ne peut pas dépasser 50 caractères")]
    public string Name { get; set; } = string.Empty;

    public string Color { get; set; } = "var(--muted2)";
}
