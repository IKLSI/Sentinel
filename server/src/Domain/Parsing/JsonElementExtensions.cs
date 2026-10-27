using System.Text.Json;

namespace Sentinel.Domain.Parsing;

public static class JsonElementExtensions
{
    public static string? StringProperty(this JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out JsonElement value) ? value.GetString() : null;
}
