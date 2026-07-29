using System.Security.Cryptography;
using System.Text;

namespace Sentinel.Application.Users;

public static class InvitationToken
{
    public static string Generate() => Convert.ToHexString(RandomNumberGenerator.GetBytes(48));

    public static string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();
}
