using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
using Sentinel.Application.Audit;
using Sentinel.Application.Security;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Application.Common.Contracts;
using Sentinel.Application.Options;

namespace Sentinel.Application.Auth.Register;

public class AuthRegisterService(
    IOrganizationRepository organizationRepository,
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IEmailVerificationTokenRepository verificationTokenRepository,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope,
    IJobScheduler jobs,
    IAuditLogService auditLog,
    QueuedTokenProtector tokenProtector,
    AuthRegisterValidator validator,
    IOptions<FrontendSettings> frontendOptions,
    ILogger<AuthRegisterService> logger) : IService
{
    private const int VerificationValidityHours = 48;

    public async Task<Result<ApiMessageResponse>> ExecuteAsync(RegisterRequest model,
        CancellationToken cancellationToken)
    {
        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        string email = model.Email.ToLowerInvariant().Trim();
        DateTime now = DateTime.UtcNow;
        string rawToken = SecureToken.Generate();
        string passwordHash = passwordHasher.Hash(model.Password);

        Organization organization;
        User admin;

        using (systemScope.Enter())
        {
            if (await userRepository.ExistsByEmailAcrossTenantsAsync(email, cancellationToken))
                return await NotifyExistingAccountAsync(email, cancellationToken);

            organization = new Organization
            {
                Name = model.OrganizationName.Trim(),
                Slug = await OrganizationSlug.GenerateUniqueAsync(model.OrganizationName, organizationRepository, cancellationToken),
                CreatedAt = now,
                UpdatedAt = now
            };

            admin = new User
            {
                OrganizationId = organization.Id,
                Email = email,
                PasswordHash = passwordHash,
                FirstName = model.FirstName.Trim(),
                LastName = model.LastName.Trim(),
                Role = UserRole.Admin,
                AccessStatus = UserAccessStatus.Active,
                IsEmailVerified = false,
                CreatedAt = now
            };

            EmailVerificationToken verificationToken = new EmailVerificationToken
            {
                UserId = admin.Id,
                Email = email,
                TokenHash = SecureToken.Hash(rawToken),
                ExpiresAt = now.AddHours(VerificationValidityHours)
            };

            using ICommitScope commitScope = commitScopeFactory.Begin();

            await organizationRepository.AddAsync(organization, cancellationToken);
            await userRepository.AddAsync(admin, cancellationToken);
            await verificationTokenRepository.AddAsync(verificationToken, cancellationToken);

            await commitScope.CommitAsync(cancellationToken);
        }

        logger.LogInformation("New organization registered {Slug} by user {UserId}", organization.Slug, admin.Id);

        string protectedToken = tokenProtector.Protect(rawToken);

        jobs.Enqueue<SendEmailVerificationJob>(JobQueues.Emails, j => j.ExecuteAsync(email, protectedToken,
            CancellationToken.None));

        await auditLog.LogAsync(
            AuditAction.OrganizationRegistered,
            entityType: AuditEntityTypes.Organization,
            organizationId: organization.Id,
            userId: admin.Id,
            entityId: organization.Id);

        return Result<ApiMessageResponse>.Accepted(ApiMessageResponse.Create(SuccessCodes.AuthAccountCreated));
    }

    private async Task<Result<ApiMessageResponse>> NotifyExistingAccountAsync(string email,
        CancellationToken cancellationToken)
    {
        string? language = await userRepository.GetLanguageByEmailOrDefaultAsync(email, cancellationToken);
        string frontendBaseUrl = frontendOptions.Value.BaseUrl;
        string culture = language ?? LanguageValues.Fr;

        jobs.Enqueue<IEmailService>(JobQueues.Emails, s => s.SendExistingAccountNoticeAsync(email, frontendBaseUrl, culture,
            CancellationToken.None));

        return Result<ApiMessageResponse>.Accepted(ApiMessageResponse.Create(SuccessCodes.AuthAccountCreated));
    }
}
