using Hangfire;
using Microsoft.Extensions.Logging;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Jobs;
using Sentinel.Application.Audit;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Auth;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.Register;

public class AuthRegisterService(
    IOrganizationRepository organizationRepository,
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITicketStatusRepository ticketStatusRepository,
    IEmailVerificationTokenRepository verificationTokenRepository,
    ICommitScopeFactory commitScopeFactory,
    ISystemScope systemScope,
    IBackgroundJobClient jobs,
    IAuditLogService auditLog,
    AuthRegisterValidator validator,
    ILogger<AuthRegisterService> logger) : IService
{
    private const int VerificationValidityHours = 48;

    public async Task<Result<ApiMessageResponse>> ExecuteAsync(RegisterRequest model,
        CancellationToken cancellationToken)
    {
        using IDisposable elevation = systemScope.Enter();

        Result validationResult = await validator.ValidateAsync(model, cancellationToken);

        if (!validationResult.IsSuccess)
            return Result<ApiMessageResponse>.From(validationResult);

        string email = model.Email.ToLower().Trim();
        DateTime now = DateTime.UtcNow;

        Organization organization = new Organization
        {
            Name = model.OrganizationName.Trim(),
            Slug = await OrganizationSlug.GenerateUniqueAsync(model.OrganizationName, organizationRepository, cancellationToken),
            PlanTier = PlanTier.Free,
            SubscriptionStatus = SubscriptionStatus.None,
            ScanCountPeriodStart = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        User admin = new User
        {
            OrganizationId = organization.Id,
            Email = email,
            PasswordHash = passwordHasher.Hash(model.Password),
            FirstName = model.FirstName.Trim(),
            LastName = model.LastName.Trim(),
            Role = UserRole.Admin,
            IsActive = true,
            IsEmailVerified = false,
            CreatedAt = now
        };

        string rawToken = SecureToken.Generate();

        EmailVerificationToken verificationToken = new EmailVerificationToken
        {
            Email = email,
            TokenHash = SecureToken.Hash(rawToken),
            ExpiresAt = now.AddHours(VerificationValidityHours)
        };

        using (ICommitScope commitScope = commitScopeFactory.Begin())
        {
            await organizationRepository.AddAsync(organization, cancellationToken);
            await userRepository.AddAsync(admin, cancellationToken);
            await ticketStatusRepository.AddRangeAsync(RegistrationTicketStatuses.For(organization.Id), cancellationToken);
            await verificationTokenRepository.AddAsync(verificationToken, cancellationToken);

            await commitScope.CommitAsync(cancellationToken);
        }

        logger.LogInformation("Nouvelle organisation enregistrée {Slug} par {Email}", organization.Slug, email);

        jobs.Enqueue<SendEmailVerificationJob>(j => j.ExecuteAsync(email, rawToken));

        await auditLog.LogAsync(AuditAction.OrganizationRegistered, entityType: AuditEntityTypes.Organization);

        return Result<ApiMessageResponse>.Accepted(ApiMessageResponse.Create(SuccessCodes.AuthAccountCreated));
    }
}
