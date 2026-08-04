using Sentinel.Domain.Abstractions.Persistence;
namespace Sentinel.Domain.Entities;

public enum AuditAction
{
    Login,
    Logout,
    PasswordResetRequested,
    PasswordReset,
    TokenRefreshed,

    OrganizationRegistered,
    EmailVerified,
    EmailVerificationResent,

    UserInvited,
    InvitationAccepted,
    UserUpdated,
    ProfileUpdated,

    TicketCreated,
    TicketUpdated,
    TicketDeleted,
    TicketStatusChanged,
    CommentAdded,
    CommentUpdated,
    CommentDeleted,
    AttachmentUploaded,
    AttachmentDeleted,

    ProjectCreated,
    ProjectUpdated,
    ProjectDeleted,
    ScanTriggered,

    OrganizationUpdated,
    GithubIntegrationSaved,
    GitlabIntegrationSaved,

    CheckoutStarted,
    BillingPortalOpened,
    SubscriptionUpdated,

    ApiKeyCreated,
    ApiKeyRevoked,

    AccountDeleted
}

public class AuditLog : IEntityWithId
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid? OrganizationId { get; set; }
    public Guid? UserId { get; set; }
    public AuditAction Action { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? Jti { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
