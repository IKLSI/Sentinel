using System.ComponentModel.DataAnnotations;

namespace Sentinel.Domain.Settings;

public class DatabaseSettings
{
    [Range(1, 500, ErrorMessage = "Database:MaxPoolSize doit être compris entre 1 et 500")]
    public int MaxPoolSize { get; set; } = 50;

    [Range(1, 300, ErrorMessage = "Database:CommandTimeoutSeconds doit être compris entre 1 et 300")]
    public int CommandTimeoutSeconds { get; set; } = 30;

    [Range(0, 10, ErrorMessage = "Database:RetryCount doit être compris entre 0 et 10")]
    public int RetryCount { get; set; } = 3;

    public bool KeepConnectionOpenPerRequest { get; set; }
}
