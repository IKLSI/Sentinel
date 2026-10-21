namespace Sentinel.Domain.Constants;

public static class ErrorCodes
{
    public const string Unexpected = "errors.common.unexpected";
    public const string Unauthorized = "errors.common.unauthorized";
    public const string Forbidden = "errors.common.forbidden";
    public const string NotFound = "errors.common.not_found";
    public const string InvalidRequest = "errors.common.invalid_request";
    public const string Concurrency = "errors.common.concurrency";
    public const string ValidationFailed = "errors.common.validation_failed";
    public const string TooManyRequests = "errors.common.too_many_requests";

    public const string AuthInvalidCredentials = "errors.auth.invalid_credentials";
    public const string AuthTooManyAttempts = "errors.auth.too_many_attempts";
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
    public const string UserSearchTooLong = "errors.users.search_too_long";
    public const string UserFilterValueInvalid = "errors.users.filter_value_invalid";
    public const string UserFilterTooManyValues = "errors.users.filter_too_many_values";
    public const string UserInvalidAccessStatus = "errors.users.invalid_access_status";
    public const string UserLastAdminRequired = "errors.users.last_admin_required";
    public const string UserCannotChangeOwnAccess = "errors.users.cannot_change_own_access";
    public const string UserCannotDeleteLastAdmin = "errors.users.cannot_delete_last_admin";
    public const string UserWrongPassword = "errors.users.wrong_password";

    public const string ApiKeyNameRequired = "errors.api_keys.name_required";
    public const string ApiKeyNameTooLong = "errors.api_keys.name_too_long";
    public const string ApiKeyExpirationRequired = "errors.api_keys.expiration_required";
    public const string ApiKeyExpirationOutOfRange = "errors.api_keys.expiration_out_of_range";
    public const string ApiKeyEndpointNotAllowed = "errors.api_keys.endpoint_not_allowed";

    public const string ProjectNotFound = "errors.projects.not_found";
    public const string VulnerabilityNotFound = "errors.projects.vulnerability_not_found";
    public const string SuppressionNotFound = "errors.projects.suppression_not_found";
    public const string ProjectInvalidRepositoryUrl = "errors.projects.invalid_repository_url";
    public const string ProjectInvalidScanFrequency = "errors.projects.invalid_scan_frequency";

    public const string SettingsTokenRequired = "errors.settings.token_required";
    public const string SettingsInvalidGithubToken = "errors.settings.invalid_github_token";
    public const string SettingsInvalidGitlabToken = "errors.settings.invalid_gitlab_token";
    public const string SettingsGitlabInstanceInUse = "errors.settings.gitlab_instance_in_use";

    public const string TicketNotFound = "errors.tickets.not_found";
    public const string TicketFindingNotFound = "errors.tickets.finding_not_found";
    public const string TicketSearchTooLong = "errors.tickets.search_too_long";
    public const string TicketFilterValueInvalid = "errors.tickets.filter_value_invalid";
    public const string TicketFilterTooManyValues = "errors.tickets.filter_too_many_values";
    public const string TicketCommentNotFound = "errors.tickets.comment_not_found";
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

    public const string ScanInvalidRepositoryUrl = "errors.scan.invalid_repository_url";
    public const string ScanNoAccessibleFiles = "errors.scan.no_accessible_files";
    public const string ScanFailed = "errors.scan.failed";
    public const string ScanVulnerabilityDataIncomplete = "errors.scan.vulnerability_data_incomplete";
    public const string ScanInventoryIncomplete = "errors.scan.inventory_incomplete";
    public const string ScanNoDependencies = "errors.scan.no_dependencies";
    public const string PublicScanBusy = "errors.scan.busy";
}
