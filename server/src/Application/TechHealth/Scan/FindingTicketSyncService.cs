using Microsoft.Extensions.Logging;
using Sentinel.Application.Audit;
using Sentinel.Application.Tickets;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.TechHealth.Scan;

public class FindingTicketSyncService(
    ITicketRepository ticketRepository,
    ITicketHistoryRepository ticketHistoryRepository,
    ICommitScopeFactory commitScopeFactory,
    IAuditLogService auditLog,
    ILogger<FindingTicketSyncService> logger)
{
    private const string StatusField = "Status";

    public async Task<FindingTicketSyncResult?> SyncAsync(Project project)
    {
        try
        {
            IReadOnlyList<Ticket> tickets = await ticketRepository.ListFindingLinkedByProjectAsync(project.Id,
                QueryTracking.Tracked, CancellationToken.None);

            if (tickets.Count == 0) return new FindingTicketSyncResult(tickets, TicketsChanged: false);

            HashSet<(FindingKind, string)> presentFindings = PresentFindings(project);
            HashSet<(FindingKind, string)> openFindings = tickets
                .Where(IsOpen)
                .Select(FindingOf)
                .ToHashSet();

            List<TicketHistory> changes = [];

            foreach (Ticket ticket in tickets)
            {
                (FindingKind, string) finding = FindingOf(ticket);
                bool isPresent = presentFindings.Contains(finding);

                if (IsOpen(ticket) && !isPresent)
                {
                    changes.Add(ChangeStatus(ticket, TicketStatus.Resolved));
                    ticket.AutoResolvedAt = DateTime.UtcNow;
                }
                else if (ticket is { Status: TicketStatus.Resolved, AutoResolvedAt: not null }
                    && isPresent
                    && openFindings.Add(finding))
                {
                    changes.Add(ChangeStatus(ticket, TicketStatus.New));
                    ticket.AutoResolvedAt = null;
                }
            }

            if (changes.Count == 0) return new FindingTicketSyncResult(tickets, TicketsChanged: false);

            using (ICommitScope commitScope = commitScopeFactory.Begin())
            {
                await ticketHistoryRepository.AddRangeAsync(changes, CancellationToken.None);
                await commitScope.CommitAsync(CancellationToken.None);
            }

            foreach (TicketHistory change in changes)
            {
                await auditLog.LogAsync(
                    AuditAction.TicketStatusChanged,
                    entityType: AuditEntityTypes.Ticket,
                    organizationId: project.OrganizationId,
                    userId: null,
                    entityId: change.TicketId);
            }

            return new FindingTicketSyncResult(tickets, TicketsChanged: true);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Unable to synchronize finding tickets for project {ProjectId}", project.Id);

            return null;
        }
    }

    private static HashSet<(FindingKind, string)> PresentFindings(Project project)
    {
        HashSet<(FindingKind, string)> findings = [];

        foreach (Dependency dependency in project.Dependencies)
        {
            foreach (Vulnerability vulnerability in dependency.Vulnerabilities)
            {
                findings.Add((FindingKind.Vulnerability,
                    FindingKeys.ForVulnerability(dependency.Ecosystem, vulnerability.PackageName,
                        vulnerability.CveId)));
            }

            if (FindingRules.IsOutdated(dependency))
                findings.Add((FindingKind.OutdatedDependency,
                    FindingKeys.ForDependency(dependency.Ecosystem, dependency.Name)));
        }

        foreach (RuntimeGroup group in RuntimeGrouping.ByName(project.Runtimes).Where(FindingRules.IsEol))
            findings.Add((FindingKind.EolRuntime, FindingKeys.ForRuntime(group.MostAtRisk.Name)));

        return findings;
    }

    private static TicketHistory ChangeStatus(Ticket ticket, TicketStatus status)
    {
        TicketHistory change = TicketQueries.CreateHistory(ticket.Id, null, StatusField,
            ticket.Status.ToString().ToLower(), status.ToString().ToLower());

        ticket.Status = status;
        ticket.UpdatedAt = DateTime.UtcNow;

        return change;
    }

    private static bool IsOpen(Ticket ticket) => TicketStatusRules.Open.Contains(ticket.Status);

    private static (FindingKind, string) FindingOf(Ticket ticket) => (ticket.FindingKind!.Value, ticket.FindingKey!);
}
