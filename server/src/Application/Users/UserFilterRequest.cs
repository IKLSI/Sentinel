namespace Sentinel.Application.Users;

public class UserFilterRequest
{
    public const int SearchMaxLength = 100;
    public const int MaxValuesPerField = 20;

    public string[] Role { get; set; } = [];
    public string[] Status { get; set; } = [];
    public string? Search { get; set; }
}
