using System.ComponentModel.DataAnnotations;

namespace Sentinel.API.Options;

public class DatabaseSettings
{
    [Range(1, 500, ErrorMessage = "Database:MaxPoolSize must be between 1 and 500")]
    public int MaxPoolSize { get; set; } = 40;

    [Range(1, 300, ErrorMessage = "Database:CommandTimeoutSeconds must be between 1 and 300")]
    public int CommandTimeoutSeconds { get; set; } = 30;

    [Range(0, 10, ErrorMessage = "Database:RetryCount must be between 0 and 10")]
    public int RetryCount { get; set; } = 3;

    public bool KeepConnectionOpenPerRequest { get; set; } = true;
}
