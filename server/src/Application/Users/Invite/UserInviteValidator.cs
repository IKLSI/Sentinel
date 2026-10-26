using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.Invite;

public class UserInviteValidator(
    IUserRepository userRepository,
    IUserInvitationRepository invitationRepository) : IValidator
{
    public async Task<Result> ValidateAsync(CreateUserDto model, Guid organizationId,
        CancellationToken cancellationToken)
    {
        ValidationErrors errors = new ValidationErrors()
            .EmailAddress(nameof(model.Email), model.Email, ValidationCodes.EmailRequired)
            .Required(nameof(model.Role), model.Role, ValidationCodes.RoleRequired)
            .ParsableEnum<UserRole>(nameof(model.Role), model.Role, ValidationCodes.RoleInvalid);

        if (errors.HasErrors)
            return errors.ToResult();

        string email = model.Email.ToLowerInvariant();

        bool memberExists = await userRepository
            .ExistsByEmailInOrganizationAsync(email, organizationId, cancellationToken);

        if (memberExists)
            return Result.Conflict(ErrorCodes.UserEmailAlreadyExists);

        bool pendingInvitation = await invitationRepository
            .ExistsPendingAsync(email, organizationId, cancellationToken);

        if (pendingInvitation)
            return Result.Conflict(ErrorCodes.UserInvitationAlreadyPending);

        return Result.Success();
    }
}
