using Microsoft.Extensions.Logging;
using Sentinel.Application.Exports.Excel;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Exports;

public sealed record ExportResult(byte[] Content, string FileName);

public class ExportService(
    ITicketRepository ticketRepository,
    IProjectRepository projectRepository,
    IUserRepository userRepository,
    IVulnerabilitySuppressionRepository suppressionRepository,
    ILocalizer localizer,
    ILogger<ExportService> logger)
{
    public async Task<ExportResult> ExportTicketsExcelAsync(
        Guid organizationId, TicketFilter filter, Guid currentUserId, CancellationToken cancellationToken)
    {
        IReadOnlyList<TicketExportRow> rows = await ticketRepository.ListForExportAsync(
            organizationId, filter, ExportLimits.MaxTicketRows + 1, cancellationToken);
        (List<TicketExportRow> tickets, bool truncated) = ExportLimits.Cap(rows, ExportLimits.MaxTicketRows);

        if (truncated)
        {
            logger.LogWarning("Ticket export for {OrganizationId} truncated at {MaxRows} rows",
                organizationId, ExportLimits.MaxTicketRows);
        }

        ExportLabels labels = await GetLabelsAsync(currentUserId, cancellationToken);

        byte[] bytes = TicketsWorkbookWriter.Write(tickets, labels, truncated);
        return new ExportResult(bytes, $"tickets-{DateTime.UtcNow:yyyy-MM-dd}.xlsx");
    }

    public async Task<ExportResult> ExportTechHealthExcelAsync(Guid organizationId, Guid currentUserId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<Project> rows = await projectRepository.ListWithHealthDetailsByNameAsync(
            organizationId, ExportLimits.MaxProjectSheets + 1, cancellationToken);
        (List<Project> projects, bool truncated) = ExportLimits.Cap(rows, ExportLimits.MaxProjectSheets);

        if (truncated)
        {
            logger.LogWarning("Tech health export for {OrganizationId} truncated at {MaxProjects} projects",
                organizationId, ExportLimits.MaxProjectSheets);
        }

        await ExcludeSuppressedVulnerabilitiesAsync(projects, cancellationToken);

        ExportLabels labels = await GetLabelsAsync(currentUserId, cancellationToken);

        byte[] bytes = TechHealthWorkbookWriter.Write(projects, labels, truncated);
        return new ExportResult(bytes, $"{labels.TechHealthSlug}-{DateTime.UtcNow:yyyy-MM-dd}.xlsx");
    }

    private async Task<ExportLabels> GetLabelsAsync(Guid currentUserId, CancellationToken cancellationToken)
    {
        string? lang = await userRepository.GetLanguageOrDefaultAsync(currentUserId, cancellationToken);

        return ExportLabels.For(localizer, lang ?? LanguageValues.Fr);
    }

    private async Task ExcludeSuppressedVulnerabilitiesAsync(List<Project> projects,
        CancellationToken cancellationToken)
    {
        IReadOnlyDictionary<Guid, IReadOnlySet<string>> suppressedKeysByProject = await suppressionRepository
            .ListActiveFindingKeysByProjectAsync(projects.Select(project => project.Id).ToList(), DateTime.UtcNow,
                cancellationToken);

        foreach (Project project in projects)
        {
            HashSet<Guid> suppressedIds =
                SuppressedVulnerabilities.IdsIn(project, suppressedKeysByProject[project.Id]);

            foreach (Dependency dependency in project.Dependencies)
            {
                dependency.Vulnerabilities = dependency.Vulnerabilities
                    .Where(vulnerability => !suppressedIds.Contains(vulnerability.Id))
                    .ToList();
            }
        }
    }
}
