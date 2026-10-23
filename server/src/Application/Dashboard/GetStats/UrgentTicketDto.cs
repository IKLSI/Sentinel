using Sentinel.Domain.Entities;
using Sentinel.Application.Common.Contracts;
namespace Sentinel.Application.Dashboard.GetStats;

public class UrgentTicketDto
{
    public string Id { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    [EnumValues(typeof(TicketPriority), lowercase: true)]
    public string Priority { get; set; } = string.Empty;
    [EnumValues(typeof(TicketType), lowercase: true)]
    public string Type { get; set; } = string.Empty;
    public string? ProjectName { get; set; }
    public string? AssignedToName { get; set; }
    public int CommentCount { get; set; }
}
