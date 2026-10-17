using Sentinel.API.Contracts;
using Sentinel.API.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using Sentinel.Application.Common;
using Sentinel.Domain.Constants;

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

    protected ActionResult ToFileResult(Result<StreamedFileDownload> result) => result.IsSuccess
        ? new StreamedFileResult(result.Value!)
        : ToErrorResult(result);

    protected ActionResult ToRevalidatedContentResult(Result<VersionedContent> result)
    {
        if (!result.IsSuccess) return ToErrorResult(result);

        Response.Headers.CacheControl = RevalidateCacheControl;

        return File(result.Value!.Content, result.Value.ContentType, null,
            new EntityTagHeaderValue(result.Value.ETag));
    }

    private const string RevalidateCacheControl = "no-cache";

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
