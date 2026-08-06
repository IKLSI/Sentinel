namespace Sentinel.Domain.Constants;

public static class RealtimeConstants
{
    public const string HubPath = "/hubs/sync";
    public const string InvalidateMethod = "invalidate";
    public const string AccessTokenQueryParameter = "access_token";
    public const string UserAgentHeader = "x-signalr-user-agent";

    public static string OrganizationGroup(Guid organizationId) => $"org:{organizationId}";
}
