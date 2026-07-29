using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TicketStatuses.GetAll;

public class TicketStatusListService(
    ITicketStatusRepository ticketStatusRepository,
    ICommitScopeFactory commitScopeFactory,
    ITenantContext tenant) : IService
{
    private static readonly (string Name, string Color, bool IsClosed, int Order, bool IsDefault)[] DefaultStatuses =
    [
        ("Nouveau",  "var(--accent)", false, 0, true),
        ("En cours", "var(--orange)", false, 1, false),
        ("Tests",    "var(--cyan)",   false, 2, false),
        ("Résolu",   "var(--green)",  true,  3, false),
        ("Fermé",    "var(--muted2)", true,  4, false),
    ];

    public async Task<Result<List<TicketStatusDto>>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId)
            return Result<List<TicketStatusDto>>.Unauthorized();

        await EnsureDefaultStatusesAsync(organizationId, cancellationToken);

        return (await ticketStatusRepository.ListForOrganizationAsync(organizationId, cancellationToken)).ToList();
    }

    private async Task EnsureDefaultStatusesAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        bool hasAny = await ticketStatusRepository.ExistsForOrganizationAsync(organizationId, cancellationToken);

        if (hasAny) return;

        List<TicketStatus> seed = DefaultStatuses.Select(d => new TicketStatus
        {
            OrganizationId = organizationId,
            Name = d.Name,
            Color = d.Color,
            Order = d.Order,
            IsDefault = d.IsDefault,
            IsClosed = d.IsClosed,
        }).ToList();

        using ICommitScope commitScope = commitScopeFactory.Begin();

        await ticketStatusRepository.AddRangeAsync(seed, cancellationToken);
        await commitScope.CommitAsync(cancellationToken);
    }
}
