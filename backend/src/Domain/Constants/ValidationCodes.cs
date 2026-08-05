namespace Sentinel.Domain.Constants;

public static class ValidationCodes
{
    public const string InvalidValue = "validation.common.invalid_value";
    public const string MaxLength = "validation.common.max_length";

    public const string PasswordRequired = "validation.password.required";
    public const string PasswordMinLength = "validation.password.min_length";
    public const string PasswordMaxLength = "validation.password.max_length";
    public const string PasswordLowercase = "validation.password.lowercase";
    public const string PasswordUppercase = "validation.password.uppercase";
    public const string PasswordDigit = "validation.password.digit";
    public const string PasswordSpecialCharacter = "validation.password.special_character";

    public const string EmailRequired = "validation.account.email_required";
    public const string EmailInvalidFormat = "validation.account.email_invalid_format";
    public const string TokenRequired = "validation.account.token_required";
    public const string FirstNameRequired = "validation.account.first_name_required";
    public const string LastNameRequired = "validation.account.last_name_required";
    public const string RoleRequired = "validation.account.role_required";
    public const string RoleInvalid = "validation.account.role_invalid";
    public const string ThemeInvalid = "validation.account.theme_invalid";

    public const string OrganizationNameRequired = "validation.organization.name_required";
    public const string OrganizationNameMinLength = "validation.organization.name_min_length";
    public const string OrganizationNameMaxLength = "validation.organization.name_max_length";
    public const string OrganizationAlertSeverityInvalid = "validation.organization.alert_severity_invalid";
    public const string OrganizationTokenRequired = "validation.organization.token_required";
    public const string OrganizationTokenMaxLength = "validation.organization.token_max_length";

    public const string ProjectNameRequired = "validation.project.name_required";
    public const string ProjectNameMaxLength = "validation.project.name_max_length";
    public const string ProjectRepositoryUrlInvalid = "validation.project.repository_url_invalid";
    public const string ProjectRepositoryTypeInvalid = "validation.project.repository_type_invalid";
    public const string ProjectScanFrequencyInvalid = "validation.project.scan_frequency_invalid";

    public const string TicketTitleRequired = "validation.ticket.title_required";
    public const string TicketTitleMaxLength = "validation.ticket.title_max_length";
    public const string TicketDescriptionMaxLength = "validation.ticket.description_max_length";
    public const string TicketPriorityInvalid = "validation.ticket.priority_invalid";
    public const string TicketTypeInvalid = "validation.ticket.type_invalid";
    public const string TicketCommentRequired = "validation.ticket.comment_required";
    public const string TicketCommentMaxLength = "validation.ticket.comment_max_length";
    public const string TicketStatusRequired = "validation.ticket.status_required";
    public const string TicketStatusInvalid = "validation.ticket.status_invalid";
}
