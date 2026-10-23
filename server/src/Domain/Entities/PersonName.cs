namespace Sentinel.Domain.Entities;

public static class PersonName
{
    public static string? Format(string? firstName, string? lastName) =>
        firstName == null && lastName == null ? null : $"{firstName} {lastName}".Trim();
}
