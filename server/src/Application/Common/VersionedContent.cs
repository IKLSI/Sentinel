using System.Security.Cryptography;

namespace Sentinel.Application.Common;

public sealed record VersionedContent(byte[] Content, string ContentType, string ETag)
{
    private const int ETagHexLength = 32;

    public static VersionedContent FromBytes(byte[] content, string contentType) =>
        new(content, contentType, $"\"{Convert.ToHexString(SHA256.HashData(content))[..ETagHexLength]}\"");
}
