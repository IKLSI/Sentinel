using Sentinel.Domain.Models;

namespace Sentinel.Application.Auth.Register;

public static class RegistrationTicketStatuses
{
    public static IEnumerable<TicketStatus> For(Guid organizationId) =>
    [
        new TicketStatus { OrganizationId = organizationId, Name = "Nouveau", Color = "var(--accent)", Order = 0, IsDefault = true, IsClosed = false },
        new TicketStatus { OrganizationId = organizationId, Name = "En cours", Color = "var(--orange)", Order = 1, IsDefault = false, IsClosed = false },
        new TicketStatus { OrganizationId = organizationId, Name = "En test", Color = "var(--cyan)", Order = 2, IsDefault = false, IsClosed = false },
        new TicketStatus { OrganizationId = organizationId, Name = "Résolu", Color = "var(--green)", Order = 3, IsDefault = false, IsClosed = true },
        new TicketStatus { OrganizationId = organizationId, Name = "Fermé", Color = "var(--muted2)", Order = 4, IsDefault = false, IsClosed = true }
    ];
}
