namespace Sentinel.Application.Common.Contracts;

[AttributeUsage(AttributeTargets.Property)]
public sealed class EnumValuesAttribute(Type enumType, bool lowercase = false) : Attribute
{
    public IReadOnlyList<string> Values { get; } = Enum.GetNames(enumType)
        .Select(name => lowercase ? name.ToLowerInvariant() : name)
        .ToArray();
}
