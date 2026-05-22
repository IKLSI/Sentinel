using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Sentinel.API.Filters;

public class ValidationFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        IServiceProvider services = context.HttpContext.RequestServices;
        Dictionary<string, List<string>>? errors = null;

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
                if (!errors.TryGetValue(key, out List<string>? list))
                {
                    list = new List<string>();
                    errors[key] = list;
                }
                list.Add(failure.ErrorMessage);
            }
        }

        if (errors != null)
        {
            ValidationProblemDetails problem = new ValidationProblemDetails(
                errors.ToDictionary(kv => kv.Key, kv => kv.Value.ToArray()))
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation échouée",
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                Instance = context.HttpContext.Request.Path
            };
            context.Result = new BadRequestObjectResult(problem);
            return;
        }

        await next();
    }

    private static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;
        if (char.IsLower(name[0])) return name;
        return char.ToLowerInvariant(name[0]) + name.Substring(1);
    }
}
