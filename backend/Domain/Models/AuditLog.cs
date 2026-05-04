namespace Sentinel.Domain.Models;

public enum AuditAction
{
    Login,
    Logout,
    PasswordResetRequested,
    PasswordReset,
    TokenRefreshed,

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

    TimeEntryCreated,
    TimeEntryUpdated,
    TimeEntryDeleted,

    ProjectCreated,
    ProjectUpdated,
    ProjectDeleted,
    ScanTriggered,

    OrganizationUpdated,
    GithubIntegrationSaved,
    GitlabIntegrationSaved
}

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? OrganizationId { get; set; }
    public Guid? UserId { get; set; }
    public AuditAction Action { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? Jti { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
