using System.ComponentModel.DataAnnotations;
using Sentinel.Domain.Models;

namespace Sentinel.Domain.DTOs.Tickets;

public class UpdateTicketDto
{
    [MaxLength(500, ErrorMessage = "Le titre ne peut pas dépasser 500 caractères")]
    public string? Title { get; set; }
    public string? Description { get; set; }
    public TicketPriority? Priority { get; set; }
    public TicketType? Type { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? AssignedToId { get; set; }
    public decimal? EstimatedHours { get; set; }
    public List<string>? Tags { get; set; }
    public bool? IsInternal { get; set; }
}
