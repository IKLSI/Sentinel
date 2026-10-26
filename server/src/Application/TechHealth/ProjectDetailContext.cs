using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.TechHealth;

public sealed record ProjectDetailContext(
    IReadOnlyList<FindingTicketRow> FindingTickets,
    IReadOnlyList<VulnerabilitySuppression> Suppressions,
    VulnerabilityRemediation? Remediation,
    bool RemediationAvailable);
