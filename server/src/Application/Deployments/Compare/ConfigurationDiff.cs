using System.Text.Json;

namespace Sentinel.Application.Deployments.Compare;

public readonly record struct ConfigurationValue(bool IsEmpty, string Fingerprint);

public sealed record ConfigurationKeyChange(string File, string Key, ReleaseChangeKind Change, bool RequiresValue);

public static class ConfigurationDiff
{
    private const string KeySeparator = ":";
    private const string AppSettingsPrefix = "appsettings";
    private const string JsonExtension = ".json";
    private const string ExportPrefix = "export ";

    private static readonly HashSet<string> EnvironmentTemplates = new(StringComparer.OrdinalIgnoreCase)
    {
        ".env.example", ".env.sample", ".env.template", ".env.dist"
    };

    private static readonly string[] LocalEnvironments = ["Development", "Local", "Test", "Testing"];

    private static readonly JsonDocumentOptions JsonOptions = new()
    {
        AllowTrailingCommas = true,
        CommentHandling = JsonCommentHandling.Skip
    };

    public static bool IsConfigurationFile(string fileName) =>
        (fileName.StartsWith(AppSettingsPrefix, StringComparison.OrdinalIgnoreCase)
            && fileName.EndsWith(JsonExtension, StringComparison.OrdinalIgnoreCase)
            && !IsLocalEnvironment(fileName))
        || EnvironmentTemplates.Contains(fileName);

    private static bool IsLocalEnvironment(string fileName) =>
        LocalEnvironments.Any(environment => fileName.Contains($".{environment}", StringComparison.OrdinalIgnoreCase));

    public static Dictionary<string, ConfigurationValue>? Read(string fileName, string content) =>
        fileName.EndsWith(JsonExtension, StringComparison.OrdinalIgnoreCase)
            ? ReadJson(content)
            : ReadEnvironment(content);

    public static List<ConfigurationKeyChange> Compare(
        IReadOnlyDictionary<string, Dictionary<string, ConfigurationValue>> baseFiles,
        IReadOnlyDictionary<string, Dictionary<string, ConfigurationValue>> headFiles)
    {
        List<ConfigurationKeyChange> changes = [];

        foreach (string file in baseFiles.Keys.Union(headFiles.Keys).Order(StringComparer.OrdinalIgnoreCase))
        {
            Dictionary<string, ConfigurationValue> before = baseFiles.GetValueOrDefault(file) ?? [];
            Dictionary<string, ConfigurationValue> after = headFiles.GetValueOrDefault(file) ?? [];

            foreach (string key in before.Keys.Union(after.Keys).Order(StringComparer.OrdinalIgnoreCase))
            {
                ConfigurationKeyChange? change = CompareKey(file, key, before, after);
                if (change != null) changes.Add(change);
            }
        }

        return changes;
    }

    private static ConfigurationKeyChange? CompareKey(string file, string key,
        Dictionary<string, ConfigurationValue> before, Dictionary<string, ConfigurationValue> after)
    {
        bool existedBefore = before.TryGetValue(key, out ConfigurationValue previous);
        bool existsAfter = after.TryGetValue(key, out ConfigurationValue current);

        if (!existedBefore) return new ConfigurationKeyChange(file, key, ReleaseChangeKind.Added, current.IsEmpty);
        if (!existsAfter) return new ConfigurationKeyChange(file, key, ReleaseChangeKind.Removed, false);
        if (previous.Fingerprint == current.Fingerprint) return null;

        return new ConfigurationKeyChange(file, key, ReleaseChangeKind.Modified, current.IsEmpty && !previous.IsEmpty);
    }

    private static Dictionary<string, ConfigurationValue>? ReadJson(string content)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(content, JsonOptions);
            Dictionary<string, ConfigurationValue> keys = new(StringComparer.OrdinalIgnoreCase);
            Flatten(document.RootElement, null, keys);
            return keys;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static void Flatten(JsonElement element, string? path, Dictionary<string, ConfigurationValue> keys)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (JsonProperty property in element.EnumerateObject())
                Flatten(property.Value, path == null ? property.Name : path + KeySeparator + property.Name, keys);
            return;
        }

        if (path == null) return;

        keys[path] = new ConfigurationValue(IsEmpty(element), element.GetRawText());
    }

    private static bool IsEmpty(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.Null => true,
        JsonValueKind.String => string.IsNullOrWhiteSpace(element.GetString()),
        JsonValueKind.Array => element.GetArrayLength() == 0,
        _ => false
    };

    private static Dictionary<string, ConfigurationValue> ReadEnvironment(string content)
    {
        Dictionary<string, ConfigurationValue> keys = new(StringComparer.Ordinal);

        foreach (string rawLine in content.Split('\n'))
        {
            string line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;
            if (line.StartsWith(ExportPrefix, StringComparison.Ordinal)) line = line[ExportPrefix.Length..].TrimStart();

            int separator = line.IndexOf('=');
            if (separator <= 0) continue;

            string value = line[(separator + 1)..].Trim().Trim('"', '\'');
            keys[line[..separator].Trim()] = new ConfigurationValue(value.Length == 0, value);
        }

        return keys;
    }
}
