using QuestPDF.Fluent;
using Sentinel.Application.Common;
using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Compliance;

public class ComplianceReportService(
    IProjectRepository projectRepository,
    IOrganizationRepository organizationRepository,
    IUserRepository userRepository,
    IAuditLogRepository auditLogRepository,
    ILocalizer localizer)
{
    private const int FingerprintLength = 16;
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

        ComplianceReportData data = BuildData(project,
            organization?.Name ?? labels.OrganizationFallback, currentUser, auditTrail, labels);
        byte[] pdf = ComplianceReportDocument.Compose(data).GeneratePdf();
        string slug = ExportFileName.Slugify(project.Name);

        return new ExportResult(pdf, $"{labels.Slug}-{slug}.pdf");
    }

    private static ComplianceReportData BuildData(Project project, string organizationName, User? currentUser,
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
        string fingerprint = SecureToken.Hash(fingerprintSource)[..FingerprintLength];

        return new ComplianceReportData
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
            Controls = EvaluateControls(project, generatedAt, vulnerabilities, eolRuntimes,
                renderedAuditTrail, labels)
        };
    }

    private static List<ComplianceControl> EvaluateControls(Project project, DateTime generatedAt,
        List<Vulnerability> vulnerabilities, List<Runtime> eolRuntimes,
        List<ComplianceAuditLogRow> auditTrail, ComplianceReportLabels labels)
    {
        bool hasUnfixableVulnerabilities = vulnerabilities.Any(v => string.IsNullOrWhiteSpace(v.FixedVersion));
        ScanReliability reliability = ComplianceScanAssessment.Of(project, generatedAt);

        return new List<ComplianceControl>
        {
            SbomControl(reliability, labels),
            CveControl(reliability, ComplianceScanAssessment.DaysSinceLastScan(project, generatedAt), labels),
            EolControl(eolRuntimes.Count, labels),
            TraceabilityControl(auditTrail.Count, labels),
            PatchingControl(hasUnfixableVulnerabilities, labels)
        };
    }

    private static ComplianceControl EolControl(int eolRuntimeCount, ComplianceReportLabels labels) =>
        eolRuntimeCount == 0
            ? new(labels.ControlEolRequirement, "CRA", ComplianceControlStatus.Covered, labels.ControlEolDetailOk)
            : new(labels.ControlEolRequirement, "CRA", ComplianceControlStatus.Attention,
                labels.ControlEolDetailWarn(eolRuntimeCount));

    private static ComplianceControl TraceabilityControl(int auditEntryCount, ComplianceReportLabels labels) =>
        auditEntryCount == 0
            ? new(labels.ControlTraceabilityRequirement, "DORA", ComplianceControlStatus.Attention,
                labels.ControlTraceabilityDetailNone)
            : new(labels.ControlTraceabilityRequirement, "DORA", ComplianceControlStatus.Covered,
                labels.ControlTraceabilityDetailCovered(auditEntryCount));

    private static ComplianceControl PatchingControl(bool hasUnfixableVulnerabilities, ComplianceReportLabels labels) =>
        hasUnfixableVulnerabilities
            ? new(labels.ControlPatchingRequirement, "NIS2", ComplianceControlStatus.Partial,
                labels.ControlPatchingDetailWarn)
            : new(labels.ControlPatchingRequirement, "NIS2", ComplianceControlStatus.Covered,
                labels.ControlPatchingDetailOk);

    private static ComplianceControl SbomControl(ScanReliability reliability, ComplianceReportLabels labels) =>
        reliability switch
        {
            ScanReliability.Missing => new(labels.ControlSbomRequirement, SbomFrameworks,
                ComplianceControlStatus.Attention, labels.ControlSbomDetailMissing),
            ScanReliability.InventoryIncomplete => new(labels.ControlSbomRequirement, SbomFrameworks,
                ComplianceControlStatus.Partial, labels.ControlSbomDetailPartial),
            _ => new(labels.ControlSbomRequirement, SbomFrameworks, ComplianceControlStatus.Covered,
                labels.ControlSbomDetail)
        };

    private static ComplianceControl CveControl(ScanReliability reliability, int daysSinceLastScan,
        ComplianceReportLabels labels) =>
        reliability switch
        {
            ScanReliability.Missing => new(labels.ControlCveRequirement, CveFrameworks,
                ComplianceControlStatus.Attention, labels.ControlCveDetailMissing),
            ScanReliability.InventoryIncomplete or ScanReliability.VulnerabilityDataIncomplete =>
                new(labels.ControlCveRequirement, CveFrameworks, ComplianceControlStatus.Partial,
                    labels.ControlCveDetailIncomplete),
            ScanReliability.Stale => new(labels.ControlCveRequirement, CveFrameworks, ComplianceControlStatus.Partial,
                labels.ControlCveDetailStale(daysSinceLastScan)),
            _ => new(labels.ControlCveRequirement, CveFrameworks, ComplianceControlStatus.Covered,
                labels.ControlCveDetail)
        };
}
