namespace Sentinel.Domain.Abstractions;

public interface IRefreshTokenStore
{
    string? Read();
    void Write(string token);
    void Clear();
}
