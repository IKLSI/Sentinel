namespace Sentinel.Application.ApiKeys.Create;

public class CreateApiKeyDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
}

public class CreatedApiKeyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Prefix { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
