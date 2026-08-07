using System.Text;

namespace Sentinel.Application.Exports;

public static class ExportFileName
{
    private const string Fallback = "export";

    public static string Slugify(string value)
    {
        StringBuilder builder = new(value.Length);

        foreach (char character in value.ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(character)) builder.Append(character);
            else if (character is ' ' or '-' or '_' or '.') builder.Append('-');
        }

        string slug = builder.ToString().Trim('-');
        return string.IsNullOrEmpty(slug) ? Fallback : slug;
    }
}
