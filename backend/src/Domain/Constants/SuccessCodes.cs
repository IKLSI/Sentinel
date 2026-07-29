namespace Sentinel.Domain.Constants;

public static class SuccessCodes
{
    public const string AuthPasswordResetRequested = "success.auth.password_reset_requested";
    public const string AuthPasswordReset = "success.auth.password_reset";
    public const string AuthAccountCreated = "success.auth.account_created";
    public const string AuthEmailVerified = "success.auth.email_verified";
    public const string AuthVerificationResent = "success.auth.verification_resent";

    public const string UserInvitationSent = "success.users.invitation_sent";
    public const string UserAccountCreated = "success.users.account_created";

    public const string JobTriggered = "success.jobs.triggered";
}
