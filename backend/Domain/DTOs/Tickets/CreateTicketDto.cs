using System.ComponentModel.DataAnnotations;
using TMAflow.Domain.Models;

namespace TMAflow.Domain.DTOs.Tickets;

public class CreateTicketDto
{
    public Guid? ProjectId { get; set; }

    [Required(ErrorMessage = "Le titre est requis")]
    [MaxLength(500, ErrorMessage = "Le titre ne peut pas dépasser 500 caractères")]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketType Type { get; set; } = TicketType.Bug;
    public Guid? AssignedToId { get; set; }
    public decimal? EstimatedHours { get; set; }
    public List<string> Tags { get; set; } = new();
}
