using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using QuestPDF.Fluent;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.TechHealth;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth.ComplianceReport;

public partial class ComplianceReportService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    IUserRepository userRepository,
    IAuditLogRepository auditLogRepository,
    ILocalizer localizer)
{
    private const string SbomFrameworks = "NIS2 · CRA · DORA";
    private const string CveFrameworks = "NIS2 · DORA";

    public async Task<ExportResult?> GenerateAsync(Guid projectId, Guid organizationId, Guid currentUserId,
        CancellationToken cancellationToken)
    {
        Project? project = await projectRepository
            .GetOrDefaultInOrganizationWithHealthDetailsAsync(projectId, organizationId, cancellationToken);

        if (project == null) return null;

        Organization? organization = await organizationRepository.GetOrDefaultAsync(organizationId,
            QueryTracking.NoTracking, cancellationToken);

        User? currentUser = await userRepository.GetOrDefaultInOrganizationAsync(currentUserId, organizationId,
            QueryTracking.NoTracking, cancellationToken);

        ComplianceReportLabels labels = new(localizer, ComplianceReportLabels.ResolveCulture(currentUser?.Language));

        IReadOnlyList<ComplianceAuditLogRow> auditTrail = await auditLogRepository.ListForProjectAsync(projectId,
            organizationId, ExportLimits.MaxComplianceAuditLogRows + 1, cancellationToken);

        ReportData data = BuildData(project, organization?.Name ?? labels.OrganizationFallback, currentUser,
            auditTrail, labels);
        byte[] pdf = Compose(data).GeneratePdf();
        string slug = ExportFileName.Slugify(project.Name);

        return new ExportResult(pdf, $"{labels.Slug}-{slug}.pdf");
    }

    private static ReportData BuildData(Project project, string organizationName, User? currentUser,
        IReadOnlyList<ComplianceAuditLogRow> auditTrail, ComplianceReportLabels labels)
    {
        List<Vulnerability> vulnerabilities = project.Dependencies
            .SelectMany(d => d.Vulnerabilities)
            .GroupBy(v => (v.CveId, PackageName: v.PackageName.ToLowerInvariant()))
            .Select(g => g.OrderBy(v => v.Severity).ThenByDescending(v => v.CvssScore).First())
            .OrderBy(v => v.Severity)
            .ThenByDescending(v => v.CvssScore)
            .ToList();

        List<Runtime> eolRuntimes = RuntimeGrouping.ByName(project.Runtimes)
            .Where(FindingRules.IsEol)
            .Select(group => group.MostAtRisk)
            .ToList();

        (List<Vulnerability> renderedVulnerabilities, bool vulnerabilitiesTruncated) =
            ExportLimits.Cap(vulnerabilities, ExportLimits.MaxComplianceVulnerabilityRows);

        (List<ComplianceAuditLogRow> renderedAuditTrail, bool auditTrailTruncated) =
            ExportLimits.Cap(auditTrail, ExportLimits.MaxComplianceAuditLogRows);

        Guid reportId = Guid.CreateVersion7();
        DateTime generatedAt = DateTime.UtcNow;
        string fingerprintSource = string.Join('|', project.OrganizationId, project.Id, generatedAt.ToString("O"),
            project.HealthScore, vulnerabilities.Count, eolRuntimes.Count, reportId);
        string fingerprint = SecureToken.Hash(fingerprintSource)[..16];

        return new ReportData
        {
            Labels = labels,
            ProjectName = project.Name,
            OrganizationName = organizationName,
            RepositoryUrl = project.RepositoryUrl,
            GeneratedAt = generatedAt,
            LastScanAt = project.LastScanAt,
            HealthScore = project.HealthScore,
            HealthGrade = project.HealthGrade,
            TotalDependencies = project.Dependencies.Count,
            CriticalCount = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.Critical),
            HighCount = vulnerabilities.Count(v => v.Severity == VulnerabilitySeverity.High),
            TotalVulnerabilities = vulnerabilities.Count,
            EolRuntimeCount = eolRuntimes.Count,
            Vulnerabilities = renderedVulnerabilities,
            VulnerabilitiesTruncated = vulnerabilitiesTruncated,
            EolRuntimes = eolRuntimes,
            AuditTrail = renderedAuditTrail,
            AuditTrailTruncated = auditTrailTruncated,
            ReportId = reportId,
            ReportFingerprint = fingerprint,
            GeneratedByName = currentUser?.FullName,
            GeneratedByEmail = currentUser?.Email,
            Controls = BuildControls(project, generatedAt, vulnerabilities, eolRuntimes, renderedAuditTrail, labels)
        };
    }

    private static List<ControlRow> BuildControls(Project project, DateTime generatedAt,
        List<Vulnerability> vulnerabilities, List<Runtime> eolRuntimes,
        List<ComplianceAuditLogRow> auditTrail, ComplianceReportLabels labels)
    {
        bool hasUnfixableVulnerabilities = vulnerabilities.Any(v => string.IsNullOrWhiteSpace(v.FixedVersion));
        ScanReliability reliability = ComplianceScanAssessment.Of(project, generatedAt);

        return new List<ControlRow>
        {
            SbomControl(reliability, labels),
            CveControl(reliability, ComplianceScanAssessment.DaysSinceLastScan(project, generatedAt), labels),
            new(labels.ControlEolRequirement, "CRA", eolRuntimes.Count == 0 ? ControlStatus.Covered : ControlStatus.Attention,
                eolRuntimes.Count == 0 ? labels.ControlEolDetailOk : labels.ControlEolDetailWarn(eolRuntimes.Count)),
            new(labels.ControlTraceabilityRequirement, "DORA",
                auditTrail.Count == 0 ? ControlStatus.Attention : ControlStatus.Covered,
                auditTrail.Count == 0
                    ? labels.ControlTraceabilityDetailNone
                    : labels.ControlTraceabilityDetailCovered(auditTrail.Count)),
            new(labels.ControlPatchingRequirement, "NIS2", hasUnfixableVulnerabilities ? ControlStatus.Partial : ControlStatus.Covered,
                hasUnfixableVulnerabilities ? labels.ControlPatchingDetailWarn : labels.ControlPatchingDetailOk)
        };
    }

    private static ControlRow SbomControl(ScanReliability reliability, ComplianceReportLabels labels) =>
        reliability switch
        {
            ScanReliability.Missing => new(labels.ControlSbomRequirement, SbomFrameworks, ControlStatus.Attention,
                labels.ControlSbomDetailMissing),
            ScanReliability.InventoryIncomplete => new(labels.ControlSbomRequirement, SbomFrameworks,
                ControlStatus.Partial, labels.ControlSbomDetailPartial),
            _ => new(labels.ControlSbomRequirement, SbomFrameworks, ControlStatus.Covered, labels.ControlSbomDetail)
        };

    private static ControlRow CveControl(ScanReliability reliability, int daysSinceLastScan,
        ComplianceReportLabels labels) =>
        reliability switch
        {
            ScanReliability.Missing => new(labels.ControlCveRequirement, CveFrameworks, ControlStatus.Attention,
                labels.ControlCveDetailMissing),
            ScanReliability.InventoryIncomplete or ScanReliability.VulnerabilityDataIncomplete =>
                new(labels.ControlCveRequirement, CveFrameworks, ControlStatus.Partial,
                    labels.ControlCveDetailIncomplete),
            ScanReliability.Stale => new(labels.ControlCveRequirement, CveFrameworks, ControlStatus.Partial,
                labels.ControlCveDetailStale(daysSinceLastScan)),
            _ => new(labels.ControlCveRequirement, CveFrameworks, ControlStatus.Covered, labels.ControlCveDetail)
        };
}
