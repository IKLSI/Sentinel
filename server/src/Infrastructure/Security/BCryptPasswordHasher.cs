using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Security;

public class BCryptPasswordHasher : IPasswordHasher
{
    private static readonly string DecoyHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString());

    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    public bool Verify(string password, string? passwordHash) =>
        !string.IsNullOrEmpty(passwordHash) && BCrypt.Net.BCrypt.Verify(password, passwordHash);

    public void VerifyAgainstDecoy(string password) => BCrypt.Net.BCrypt.Verify(password, DecoyHash);
}
