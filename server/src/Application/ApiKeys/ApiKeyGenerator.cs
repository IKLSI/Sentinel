using System.Security.Cryptography;
using Sentinel.Application.Common;

namespace Sentinel.Application.ApiKeys;

public static class ApiKeyGenerator
{
    private const string Prefix = "sen_";
    private const int ByteLength = 32;
    private const int PrefixLength = 12;

    public static (string RawKey, string KeyHash, string DisplayPrefix) Generate()
    {
        string rawKey = Prefix + Convert.ToHexString(RandomNumberGenerator.GetBytes(ByteLength)).ToLowerInvariant();

        return (rawKey, Hash(rawKey), rawKey[..Math.Min(PrefixLength, rawKey.Length)]);
    }

    public static string Hash(string rawKey) => SecureToken.Hash(rawKey);
}
