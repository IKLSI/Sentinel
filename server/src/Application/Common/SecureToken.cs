using System.Security.Cryptography;
using System.Text;

namespace Sentinel.Application.Common;

public static class SecureToken
{
    private const int ByteLength = 48;

    public static string Generate() => Convert.ToHexString(RandomNumberGenerator.GetBytes(ByteLength));

    public static string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();
}
