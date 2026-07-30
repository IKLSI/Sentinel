using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.Settings;

public class FrontendSettings
{
    public const string DefaultBaseUrl = "http://localhost:3000";

    [Url(ErrorMessage = "Frontend:BaseUrl must be a valid absolute URL")]
    public string BaseUrl { get; set; } = DefaultBaseUrl;
}
