using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;

namespace Sentinel.Application.Compliance;

internal sealed class ComplianceReportLabels(ILocalizer localizer, string culture)
{
    private const string CountParameter = "count";

    public string Slug => Text("exports.compliance.slug");
    public string Title => Text("exports.compliance.title");
    public string DateFormat => Text("exports.stamp_date_format");
    public string At => Text("exports.at");
    public string OrganizationFallback => Text("exports.compliance.organization_fallback");

    public string SummaryDependencies => Text("exports.compliance.summary.dependencies");
    public string SummaryCritical => Text("exports.compliance.summary.critical");
    public string SummaryVulnerabilities => Text("exports.compliance.summary.vulnerabilities");
    public string SummaryEolRuntimes => Text("exports.compliance.summary.eol_runtimes");

    public string SectionControls => Text("exports.compliance.section.controls");

    public string HeaderRequirement => Text("exports.compliance.header.requirement");
    public string HeaderFramework => Text("exports.compliance.header.framework");
    public string HeaderStatus => Text("exports.compliance.header.status");
    public string HeaderComponent => Text("exports.compliance.header.component");
    public string HeaderReference => Text("exports.compliance.header.reference");
    public string HeaderSeverity => Text("exports.header.vulnerability.severity");
    public string HeaderFix => Text("exports.compliance.header.fix");
    public string HeaderRuntime => Text("exports.header.runtime.runtime");
    public string HeaderVersion => Text("exports.header.runtime.version");
    public string HeaderSupportEnds => Text("exports.header.runtime.support_ends");

    public string StatusCovered => Text("exports.compliance.status.covered");
    public string StatusPartial => Text("exports.compliance.status.partial");
    public string StatusAttention => Text("exports.compliance.status.attention");

    public string SeverityCritical => Text("exports.severity.critical");
    public string SeverityHigh => Text("exports.severity.high");
    public string SeverityMedium => Text("exports.severity.medium");
    public string SeverityLow => Text("exports.severity.low");

    public string ControlSbomRequirement => Text("exports.compliance.control.sbom.requirement");
    public string ControlSbomDetail => Text("exports.compliance.control.sbom.detail");
    public string ControlSbomDetailMissing => Text("exports.compliance.control.sbom.detail_missing");
    public string ControlSbomDetailPartial => Text("exports.compliance.control.sbom.detail_partial");
    public string ControlCveRequirement => Text("exports.compliance.control.cve.requirement");
    public string ControlCveDetail => Text("exports.compliance.control.cve.detail");
    public string ControlCveDetailMissing => Text("exports.compliance.control.cve.detail_missing");
    public string ControlCveDetailIncomplete => Text("exports.compliance.control.cve.detail_incomplete");
    public string ControlEolRequirement => Text("exports.compliance.control.eol.requirement");
    public string ControlEolDetailOk => Text("exports.compliance.control.eol.detail_ok");
    public string ControlTraceabilityRequirement => Text("exports.compliance.control.traceability.requirement");
    public string ControlTraceabilityDetailNone => Text("exports.compliance.control.traceability.detail_none");
    public string ControlPatchingRequirement => Text("exports.compliance.control.patching.requirement");
    public string ControlPatchingDetailOk => Text("exports.compliance.control.patching.detail_ok");
    public string ControlPatchingDetailWarn => Text("exports.compliance.control.patching.detail_warn");

    public string EolReached => Text("exports.compliance.eol.reached");
    public string AttestationTitle => Text("exports.compliance.attestation.title");
    public string AttestationIntro => Text("exports.compliance.attestation.intro");
    public string AttestationWithoutScan => Text("exports.compliance.attestation.without_scan");
    public string AttestationDisclaimer => Text("exports.compliance.attestation.disclaimer");
    public string FooterConfidential => Text("exports.compliance.footer.confidential");

    public string HeaderEventDate => Text("exports.compliance.header.event_date");
    public string HeaderEventAction => Text("exports.compliance.header.event_action");
    public string HeaderEventUser => Text("exports.compliance.header.event_user");
    public string EventSystemUser => Text("exports.compliance.event.system_user");

    public string ControlCveDetailStale(int days) =>
        localizer.Get(culture, "exports.compliance.control.cve.detail_stale",
            new Dictionary<string, string> { ["days"] = days.ToString() });

    public string ControlEolDetailWarn(int count) =>
        Count("exports.compliance.control.eol.detail_warn", count);

    public string ControlTraceabilityDetailCovered(int count) =>
        Count("exports.compliance.control.traceability.detail_covered", count);

    public string SectionVulnerabilities(int count) =>
        Count("exports.compliance.section.vulnerabilities", count);

    public string SectionEolRuntimes(int count) =>
        Count("exports.compliance.section.eol_runtimes", count);

    public string SectionAuditTrail(int count) =>
        Count("exports.compliance.section.audit_trail", count);

    public string VulnerabilitiesHidden(int count) =>
        Count("exports.compliance.vulnerabilities.hidden", count);

    public string AttestationWithScan(string date) =>
        localizer.Get(culture, "exports.compliance.attestation.with_scan",
            new Dictionary<string, string> { ["date"] = date });

    public string GeneratedBy(string name) =>
        localizer.Get(culture, "exports.compliance.attestation.generated_by",
            new Dictionary<string, string> { ["name"] = name });

    public string ReportId(string id) =>
        localizer.Get(culture, "exports.compliance.footer.report_id",
            new Dictionary<string, string> { ["id"] = id });

    public string AuditActionLabel(string action) => action switch
    {
        "ProjectCreated" => Text("exports.compliance.audit_action.project_created"),
        "ProjectUpdated" => Text("exports.compliance.audit_action.project_updated"),
        "ProjectDeleted" => Text("exports.compliance.audit_action.project_deleted"),
        "ScanTriggered" => Text("exports.compliance.audit_action.scan_triggered"),
        "ScanCompleted" => Text("exports.compliance.audit_action.scan_completed"),
        "ScanCancelled" => Text("exports.compliance.audit_action.scan_cancelled"),
        _ => action
    };

    public static string ResolveCulture(string? language) =>
        language != null && LanguageValues.All.Contains(language) ? language : LanguageValues.Fr;

    private string Text(string key) => localizer.Get(culture, key);

    private string Count(string key, int count) =>
        localizer.Get(culture, key, new Dictionary<string, string> { [CountParameter] = count.ToString() });
}
