using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Auth.Register;

public static class OrganizationSlug
{
    private const int MaxLength = 90;
    private const string Fallback = "org";

    public static async Task<string> GenerateUniqueAsync(string name, IOrganizationRepository repository,
        CancellationToken cancellationToken)
    {
        string baseSlug = Slugify(name);

        if (string.IsNullOrEmpty(baseSlug)) baseSlug = Fallback;

        string candidate = baseSlug;
        int suffix = 2;

        while (await repository.ExistsBySlugAsync(candidate, cancellationToken))
        {
            candidate = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return candidate;
    }

    private static string Slugify(string value)
    {
        string lower = value.Trim().ToLowerInvariant();
        string slug = new string(lower.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());

        while (slug.Contains("--")) slug = slug.Replace("--", "-");

        slug = slug.Trim('-');

        return slug.Length > MaxLength ? slug[..MaxLength].Trim('-') : slug;
    }
}
