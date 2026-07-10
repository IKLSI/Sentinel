namespace Sentinel.Domain.Settings;

public class ForwardedHeadersSettings
{
    public List<string> KnownProxies { get; set; } = new();
    public List<string> KnownNetworks { get; set; } = new();
    public int ForwardLimit { get; set; } = 1;
}
