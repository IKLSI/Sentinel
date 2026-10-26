namespace Sentinel.Application.Common;

public static class FilterValues
{
    public static Result Validate<TEnum>(string[] values, string field, int maxValues, string tooManyCode,
        string invalidCode) where TEnum : struct, Enum
    {
        Result countResult = ValidateCount(values, field, maxValues, tooManyCode);

        if (!countResult.IsSuccess)
            return countResult;

        foreach (string value in values)
        {
            if (!EnumValue.TryParse(value, out TEnum _))
                return Invalid(field, value, invalidCode);
        }

        return Result.Success();
    }

    public static Result ValidateCount(string[] values, string field, int maxValues, string tooManyCode)
    {
        if (values.Length <= maxValues)
            return Result.Success();

        return Result.Error(tooManyCode, new Dictionary<string, string>
        {
            ["field"] = field,
            ["maxValues"] = maxValues.ToString()
        });
    }

    public static Result Invalid(string field, string value, string invalidCode) =>
        Result.Error(invalidCode, new Dictionary<string, string>
        {
            ["field"] = field,
            ["value"] = value
        });

    public static List<TEnum> ParseDistinct<TEnum>(string[] values) where TEnum : struct, Enum
    {
        List<TEnum> parsed = [];

        foreach (string value in values)
        {
            if (EnumValue.TryParse(value, out TEnum result) && !parsed.Contains(result))
                parsed.Add(result);
        }

        return parsed;
    }
}
