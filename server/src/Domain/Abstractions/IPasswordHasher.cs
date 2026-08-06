namespace Sentinel.Domain.Abstractions;

public interface IPasswordHasher
{
    string Hash(string password);

    bool Verify(string password, string? passwordHash);

    void VerifyAgainstDecoy(string password);
}
