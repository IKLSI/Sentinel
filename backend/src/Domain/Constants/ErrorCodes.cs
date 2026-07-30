namespace Sentinel.Domain.Constants;

public static class ErrorCodes
{
    public const string Unexpected = "errors.common.unexpected";
    public const string Unauthorized = "errors.common.unauthorized";
    public const string Forbidden = "errors.common.forbidden";
    public const string NotFound = "errors.common.not_found";
    public const string InvalidRequest = "errors.common.invalid_request";
    public const string InvalidOperation = "errors.common.invalid_operation";
    public const string Concurrency = "errors.common.concurrency";
    public const string ValidationFailed = "errors.common.validation_failed";
    public const string TooManyRequests = "errors.common.too_many_requests";

    public const string AuthInvalidCredentials = "errors.auth.invalid_credentials";
    public const string AuthInvalidRefreshToken = "errors.auth.invalid_refresh_token";
    public const string AuthEmailNotVerified = "errors.auth.email_not_verified";
    public const string AuthEmailAlreadyUsed = "errors.auth.email_already_used";
    public const string AuthInvalidResetLink = "errors.auth.invalid_reset_link";
    public const string AuthInvalidVerificationLink = "errors.auth.invalid_verification_link";

    public const string UserNotFound = "errors.users.not_found";
    public const string UserEmailAlreadyExists = "errors.users.email_already_exists";
    public const string UserInvitationAlreadyPending = "errors.users.invitation_already_pending";
    public const string UserInvitationInvalid = "errors.users.invitation_invalid";
    public const string UserInvalidRole = "errors.users.invalid_role";
    public const string UserLastAdminRequired = "errors.users.last_admin_required";
    public const string UserCannotDeleteLastAdmin = "errors.users.cannot_delete_last_admin";
    public const string UserWrongPassword = "errors.users.wrong_password";

    public const string ApiKeyNameRequired = "errors.api_keys.name_required";
    public const string ApiKeyNameTooLong = "errors.api_keys.name_too_long";
    public const string ApiKeyNotFound = "errors.api_keys.not_found";

    public const string BillingInvalidPlan = "errors.billing.invalid_plan";
    public const string BillingProviderUnavailable = "errors.billing.provider_unavailable";
    public const string BillingFreePlanNoPayment = "errors.billing.free_plan_no_payment";
    public const string BillingNoActiveSubscription = "errors.billing.no_active_subscription";
    public const string BillingPriceNotConfigured = "errors.billing.price_not_configured";

    public const string QuotaProjectsExceeded = "errors.quota.projects_exceeded";
    public const string QuotaMembersExceeded = "errors.quota.members_exceeded";
    public const string QuotaScansExceeded = "errors.quota.scans_exceeded";
    public const string QuotaRemediationsExceeded = "errors.quota.remediations_exceeded";

    public const string ProjectNotFound = "errors.projects.not_found";
    public const string ProjectInvalidRepositoryUrl = "errors.projects.invalid_repository_url";
    public const string ProjectInvalidScanFrequency = "errors.projects.invalid_scan_frequency";
    public const string ProjectScanFrequencyAbovePlan = "errors.projects.scan_frequency_above_plan";

    public const string SettingsTokenRequired = "errors.settings.token_required";
    public const string SettingsInvalidGithubToken = "errors.settings.invalid_github_token";
    public const string SettingsInvalidGitlabToken = "errors.settings.invalid_gitlab_token";
    public const string SettingsOrganizationNameRequired = "errors.settings.organization_name_required";

    public const string TicketNotFound = "errors.tickets.not_found";
    public const string TicketSearchTooLong = "errors.tickets.search_too_long";
    public const string TicketCommentNotFound = "errors.tickets.comment_not_found";
    public const string TicketCommentContentRequired = "errors.tickets.comment_content_required";
    public const string TicketInvalidStatus = "errors.tickets.invalid_status";
    public const string TicketAttachmentNotFound = "errors.tickets.attachment_not_found";
    public const string TicketAttachmentFileMissing = "errors.tickets.attachment_file_missing";
    public const string TicketAttachmentInvalidFile = "errors.tickets.attachment_invalid_file";
    public const string TicketAttachmentTypeNotAllowed = "errors.tickets.attachment_type_not_allowed";
    public const string TicketAttachmentInvalidFileName = "errors.tickets.attachment_invalid_file_name";
    public const string TicketAttachmentTooLarge = "errors.tickets.attachment_too_large";

    public const string LocaleInvalidCulture = "errors.locales.invalid_culture";
    public const string LocaleInvalidPath = "errors.locales.invalid_path";
    public const string LocaleNotFound = "errors.locales.not_found";
}
