using Microsoft.AspNetCore.Mvc;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;
using Sentinel.Application.Common.Contracts;

namespace Sentinel.API.Controllers;

public abstract class BaseController : ControllerBase
{
    protected ActionResult ToActionResult(Result result) => result.Status switch
    {
        ResultStatus.Success => Ok(),
        ResultStatus.NoContent => NoContent(),
        ResultStatus.Accepted => Accepted(),
        _ => ToErrorResult(result)
    };

    protected ActionResult ToActionResult<T>(Result<T> result) => result.Status switch
    {
        ResultStatus.Success => result.Value is null ? Ok() : Ok(result.Value),
        ResultStatus.Accepted => result.Value is null ? Accepted() : Accepted(result.Value),
        ResultStatus.NoContent => NoContent(),
        _ => ToErrorResult(result)
    };

    protected ActionResult ToFileResult(Result<FileDownload> result) => result.IsSuccess
        ? File(result.Value!.Content, result.Value.ContentType, result.Value.FileName)
        : ToErrorResult(result);

    private ActionResult ToErrorResult(Result result) => result.Status switch
    {
        ResultStatus.Invalid => BadRequest(BuildValidationError(result)),
        ResultStatus.NotFound => result.Code == null
            ? NotFound()
            : NotFound(BuildError(result, StatusCodes.Status404NotFound)),
        ResultStatus.Unauthorized => result.Code == null
            ? Unauthorized()
            : Unauthorized(BuildError(result, StatusCodes.Status401Unauthorized)),
        ResultStatus.Forbidden => result.Code == null
            ? Forbid()
            : StatusCode(StatusCodes.Status403Forbidden, BuildError(result, StatusCodes.Status403Forbidden)),
        ResultStatus.PaymentRequired => StatusCode(StatusCodes.Status402PaymentRequired,
            BuildError(result, StatusCodes.Status402PaymentRequired)),
        ResultStatus.Conflict => Conflict(BuildError(result, StatusCodes.Status409Conflict)),
        _ => result.Code == null
            ? BadRequest()
            : BadRequest(BuildError(result, StatusCodes.Status400BadRequest))
    };

    private static ApiErrorResponse BuildError(Result result, int status) =>
        new() { Code = result.Code ?? ErrorCodes.Unexpected, Status = status, Params = result.Params };

    private static ApiValidationErrorResponse BuildValidationError(Result result) => new()
    {
        Code = ErrorCodes.ValidationFailed,
        Status = StatusCodes.Status400BadRequest,
        Errors = result.ValidationErrors
            .GroupBy(error => ToCamelCase(error.Identifier))
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(error => new ValidationErrorItem { Code = error.Code, Params = error.Params })
                    .ToArray())
    };

    private static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name) || char.IsLower(name[0])) return name;

        return string.Create(name.Length, name, static (span, source) =>
        {
            source.AsSpan().CopyTo(span);
            span[0] = char.ToLowerInvariant(span[0]);
        });
    }
}
