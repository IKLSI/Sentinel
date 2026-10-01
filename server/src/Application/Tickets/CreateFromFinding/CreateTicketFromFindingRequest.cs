using Sentinel.Domain.Entities;

namespace Sentinel.Application.Tickets.CreateFromFinding;

public class CreateTicketFromFindingRequest
{
    public Guid ProjectId { get; set; }
    public FindingKind Kind { get; set; }
    public string FindingKey { get; set; } = string.Empty;
}
