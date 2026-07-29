using Sentinel.Domain.Abstractions;

namespace Sentinel.Infrastructure.Security;

public class BCryptPasswordHasher : IPasswordHasher
{
    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password);

    public bool Verify(string password, string? passwordHash) =>
        !string.IsNullOrEmpty(passwordHash) && BCrypt.Net.BCrypt.Verify(password, passwordHash);
}
