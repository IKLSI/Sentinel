namespace Sentinel.Domain.Abstractions;

public interface ILocalizer
{
    string Get(string culture, string key);

    string Get(string culture, string key, IReadOnlyDictionary<string, string> parameters);
}
