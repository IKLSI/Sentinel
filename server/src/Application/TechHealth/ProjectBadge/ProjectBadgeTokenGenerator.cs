using System.Security.Cryptography;

namespace Sentinel.Application.TechHealth.ProjectBadge;

public static class ProjectBadgeTokenGenerator
{
    public const int ByteLength = 18;

    public static string Generate() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(ByteLength))
            .Replace('+', '-')
            .Replace('/', '_');
}
