using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Users;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.UpdatePreferences;

public class UserUpdatePreferencesService(
    IUserRepository userRepository,
    IUnitOfWorkManager unitOfWorkManager,
    ITenantContext tenant,
    UserUpdatePreferencesValidator validator) : IService
{

    public async Task<Result> ExecuteAsync(UpdatePreferencesDto model, CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return validationResult;

        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid currentUserId)
            return Result.Unauthorized();

        User? user = await userRepository.GetOrDefaultInOrganizationAsync(currentUserId, organizationId,
            new SingleEntityQueryOptions<User>(), cancellationToken);

        if (user == null)
            return Result.NotFound(ErrorCodes.UserNotFound);

        if (!string.IsNullOrEmpty(model.Theme) && Enum.TryParse(model.Theme, true, out ThemeType theme))
            user.Theme = theme;

        if (!string.IsNullOrEmpty(model.Language) && LanguageValues.All.Contains(model.Language))
            user.Language = model.Language;

        using IUnitOfWork unitOfWork = unitOfWorkManager.NewUnitOfWork();

        await unitOfWork.CommitAsync(cancellationToken);

        return Result.NoContent();
    }
}
