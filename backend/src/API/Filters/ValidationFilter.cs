using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Sentinel.Domain.Constants;
using Sentinel.Domain.DTOs.Common;

namespace Sentinel.API.Filters;

public class ValidationFilter : IAsyncActionFilter
{
    private static readonly string[] TranslatablePlaceholders =
        ["MaxLength", "MinLength", "ComparisonValue", "ExpectedPrecision", "ExpectedScale", "From", "To"];

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        IServiceProvider services = context.HttpContext.RequestServices;
        Dictionary<string, List<ValidationErrorItem>>? errors = null;

        foreach (object? argument in context.ActionArguments.Values)
        {
            if (argument == null) continue;

            Type validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            object? validator = services.GetService(validatorType);

            if (validator == null) continue;

            IValidationContext validationContext = (IValidationContext)Activator
                .CreateInstance(typeof(ValidationContext<>).MakeGenericType(argument.GetType()), argument)!;

            ValidationResult result = await ((IValidator)validator).ValidateAsync(validationContext);

            if (result.IsValid) continue;

            errors ??= new();

            foreach (ValidationFailure failure in result.Errors)
            {
                string key = ToCamelCase(failure.PropertyName);

                if (!errors.TryGetValue(key, out List<ValidationErrorItem>? list))
                {
                    list = new List<ValidationErrorItem>();
                    errors[key] = list;
                }

                list.Add(new ValidationErrorItem
                {
                    Code = failure.ErrorMessage,
                    Params = ExtractParams(failure)
                });
            }
        }

        if (errors != null)
        {
            context.Result = new BadRequestObjectResult(new ApiValidationErrorResponse
            {
                Code = ErrorCodes.ValidationFailed,
                Status = StatusCodes.Status400BadRequest,
                Errors = errors.ToDictionary(kv => kv.Key, kv => kv.Value.ToArray())
            });

            return;
        }

        await next();
    }

    private static IReadOnlyDictionary<string, string>? ExtractParams(ValidationFailure failure)
    {
        if (failure.FormattedMessagePlaceholderValues == null) return null;

        Dictionary<string, string> parameters = failure.FormattedMessagePlaceholderValues
            .Where(kv => TranslatablePlaceholders.Contains(kv.Key) && kv.Value != null)
            .ToDictionary(kv => ToCamelCase(kv.Key), kv => kv.Value!.ToString()!);

        return parameters.Count == 0 ? null : parameters;
    }

    private static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;
        if (char.IsLower(name[0])) return name;

        return char.ToLowerInvariant(name[0]) + name.Substring(1);
    }
}
