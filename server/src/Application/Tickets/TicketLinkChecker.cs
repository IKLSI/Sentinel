using Sentinel.Domain.Constants;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Tickets;

public class TicketLinkChecker(IProjectRepository projectRepository, IUserRepository userRepository)
{
    public async Task<string?> FindMissingAsync(Guid? projectId, Guid? assignedToId, Guid organizationId,
        CancellationToken cancellationToken)
    {
        if (projectId is Guid linkedProjectId
            && !await projectRepository.ExistsInOrganizationAsync(linkedProjectId, organizationId, cancellationToken))
            return ErrorCodes.ProjectNotFound;

        if (assignedToId is Guid assigneeId
            && !await userRepository.ExistsInOrganizationAsync(assigneeId, organizationId, cancellationToken))
            return ErrorCodes.UserNotFound;

        return null;
    }
}
