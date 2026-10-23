using Sentinel.Application.Audit;
using Sentinel.Application.Dashboard;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Realtime;

namespace Sentinel.Application.TechHealth.Scan;

public sealed record ScanFindingsContext(
    bool FindingsReliable,
    DateTime? AlertBaseline,
    HashSet<Guid> SuppressedVulnerabilityIds,
    bool ProjectChanged = true);

public class ScanFollowUpService(
    FindingTicketSyncService findingTicketSync,
    CriticalVulnerabilityTicketService criticalVulnerabilityTickets,
    VulnerabilityAlertService vulnerabilityAlerts,
    IAuditLogService auditLog,
    DashboardCache dashboardCache,
    IRealtimeNotifier realtimeNotifier)
{
    public async Task RunAsync(Project project, ScanFindingsContext findings, CancellationToken cancellationToken)
    {
        bool ticketsChanged = false;

        if (findings.FindingsReliable)
        {
            FindingTicketSyncResult? sync = await findingTicketSync.SyncAsync(project, cancellationToken);
            bool ticketsCreated = await criticalVulnerabilityTickets.CreateMissingAsync(project, sync?.LinkedTickets,
                findings.SuppressedVulnerabilityIds, cancellationToken);
            ticketsChanged = sync?.TicketsChanged == true || ticketsCreated;
        }

        await auditLog.LogAsync(
            AuditAction.ScanCompleted,
            entityType: AuditEntityTypes.Project,
            organizationId: project.OrganizationId,
            userId: null,
            entityId: project.Id);

        if (findings.ProjectChanged || ticketsChanged)
        {
            dashboardCache.Invalidate(project.OrganizationId);

            if (ticketsChanged)
                await realtimeNotifier.NotifyOrganizationAsync(project.OrganizationId,
                    new RealtimeEvent(RealtimeResources.Tickets,
                        ProjectIds: RealtimeEvent.AffectedProjects(project.Id)));

            await realtimeNotifier.NotifyOrganizationAsync(project.OrganizationId,
                new RealtimeEvent(RealtimeResources.Project, project.Id));
        }

        if (findings.FindingsReliable)
            await vulnerabilityAlerts.TrySendAsync(project, findings.AlertBaseline,
                findings.SuppressedVulnerabilityIds, cancellationToken);
    }
}
