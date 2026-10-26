using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Domain.TechHealth;

namespace Sentinel.Application.Tickets.CreateFromFinding;

public class TicketCreateFromFindingService(
    ITicketRepository ticketRepository,
    IProjectRepository projectRepository,
    IUserRepository userRepository,
    ILocalizer localizer,
    TicketCreator ticketCreator,
    IRealtimeNotifier realtimeNotifier,
    ITenantContext tenant,
    TicketCreateFromFindingValidator validator) : IService
{
    public async Task<Result<TicketDto>> ExecuteAsync(CreateTicketFromFindingRequest model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<TicketDto>.From(validationResult);

        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid userId)
            return Result<TicketDto>.Unauthorized();

        if (!await projectRepository.ExistsInOrganizationAsync(model.ProjectId, organizationId, cancellationToken))
            return Result<TicketDto>.NotFound(ErrorCodes.ProjectNotFound);

        string findingKey = model.FindingKey.Trim().ToLowerInvariant();

        Ticket? existing = await ticketRepository.GetOpenForFindingAsync(model.ProjectId, model.Kind, findingKey,
            cancellationToken);

        if (existing != null)
            return await ticketCreator.LoadDtoAsync(existing.Id, cancellationToken);

        Project? project = await projectRepository.GetOrDefaultInOrganizationForFindingAsync(model.ProjectId,
            organizationId, model.Kind, findingKey, cancellationToken);

        if (project == null)
            return Result<TicketDto>.NotFound(ErrorCodes.ProjectNotFound);

        string culture = await userRepository.GetLanguageOrDefaultAsync(userId, cancellationToken)
            ?? LanguageValues.Fr;

        FindingTicketDraft? draft = BuildDraft(project, model.Kind, findingKey,
            new FindingTicketDraftBuilder(localizer, culture));

        if (draft == null)
            return Result<TicketDto>.NotFound(ErrorCodes.TicketFindingNotFound);

        Ticket ticket = new Ticket
        {
            OrganizationId = organizationId,
            ProjectId = project.Id,
            Title = draft.Title,
            Description = draft.Description,
            Priority = draft.Priority,
            Type = draft.Type,
            Status = TicketStatus.New,
            CreatedById = userId,
            FindingKind = model.Kind,
            FindingKey = findingKey,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            await ticketCreator.InsertAsync(ticket, cancellationToken);
        }
        catch (UniqueConstraintViolationException)
        {
            Ticket? concurrent = await ticketRepository.GetOpenForFindingAsync(model.ProjectId, model.Kind, findingKey,
                cancellationToken);

            if (concurrent == null) throw;

            return await ticketCreator.LoadDtoAsync(concurrent.Id, cancellationToken);
        }

        await realtimeNotifier.NotifyOrganizationAsync(organizationId, TicketCreator.CreatedEvent(ticket));

        return await ticketCreator.AuditAndLoadAsync(ticket, cancellationToken);
    }

    private static FindingTicketDraft? BuildDraft(Project project, FindingKind kind, string findingKey,
        FindingTicketDraftBuilder builder)
    {
        switch (kind)
        {
            case FindingKind.Vulnerability:
                foreach (Dependency dependency in project.Dependencies)
                {
                    Vulnerability? vulnerability = dependency.Vulnerabilities.FirstOrDefault(candidate =>
                        FindingKeys.ForVulnerability(dependency, candidate) == findingKey);

                    if (vulnerability != null) return builder.ForVulnerability(dependency, vulnerability);
                }

                return null;

            case FindingKind.OutdatedDependency:
                Dependency? outdated = project.Dependencies.FirstOrDefault(dependency =>
                    FindingKeys.ForDependency(dependency.Ecosystem, dependency.Name) == findingKey
                    && FindingRules.IsOutdated(dependency));

                return outdated == null ? null : builder.ForDependency(outdated);

            case FindingKind.EolRuntime:
                RuntimeGroup? runtime = RuntimeGrouping.ByName(project.Runtimes).FirstOrDefault(group =>
                    FindingKeys.ForRuntime(group.MostAtRisk.Name) == findingKey && FindingRules.IsEol(group));

                return runtime == null ? null : builder.ForRuntime(runtime);

            default:
                return null;
        }
    }
}
