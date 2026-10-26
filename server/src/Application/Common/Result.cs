using Sentinel.Domain.Constants;

namespace Sentinel.Application.Common;

public class Result
{
    protected Result(
        ResultStatus status,
        string? code = null,
        IReadOnlyDictionary<string, string>? parameters = null,
        IReadOnlyList<ValidationError>? validationErrors = null)
    {
        Status = status;
        Code = code;
        Params = parameters;
        ValidationErrors = validationErrors ?? [];
    }

    public ResultStatus Status { get; }
    public string? Code { get; }
    public IReadOnlyDictionary<string, string>? Params { get; }
    public IReadOnlyList<ValidationError> ValidationErrors { get; }

    public bool IsSuccess => Status is ResultStatus.Success or ResultStatus.NoContent or ResultStatus.Accepted;

    public static Result Success() => new(ResultStatus.Success);

    public static Result NoContent() => new(ResultStatus.NoContent);

    public static Result Accepted() => new(ResultStatus.Accepted);

    public static Result Invalid(IReadOnlyList<ValidationError> validationErrors) =>
        new(ResultStatus.Invalid, ErrorCodes.ValidationFailed, null, validationErrors);

    public static Result NotFound(string? code = null, IReadOnlyDictionary<string, string>? parameters = null) =>
        new(ResultStatus.NotFound, code, parameters);

    public static Result Unauthorized(string? code = null) => new(ResultStatus.Unauthorized, code);

    public static Result Forbidden(string? code = null) => new(ResultStatus.Forbidden, code);

    public static Result Conflict(string code, IReadOnlyDictionary<string, string>? parameters = null) =>
        new(ResultStatus.Conflict, code, parameters);

    public static Result Error(string? code = null, IReadOnlyDictionary<string, string>? parameters = null) =>
        new(ResultStatus.Error, code, parameters);
}

public sealed class Result<T> : Result
{
    private Result(
        T? value,
        ResultStatus status,
        string? code = null,
        IReadOnlyDictionary<string, string>? parameters = null,
        IReadOnlyList<ValidationError>? validationErrors = null)
        : base(status, code, parameters, validationErrors)
    {
        Value = value;
    }

    public T? Value { get; }

    public static Result<T> Success(T value) => new(value, ResultStatus.Success);

    public static Result<T> Accepted(T value) => new(value, ResultStatus.Accepted);

    public new static Result<T> Invalid(IReadOnlyList<ValidationError> validationErrors) =>
        new(default, ResultStatus.Invalid, ErrorCodes.ValidationFailed, null, validationErrors);

    public new static Result<T> NotFound(string? code = null, IReadOnlyDictionary<string, string>? parameters = null) =>
        new(default, ResultStatus.NotFound, code, parameters);

    public new static Result<T> Unauthorized(string? code = null) =>
        new(default, ResultStatus.Unauthorized, code);

    public new static Result<T> Forbidden(string? code = null) =>
        new(default, ResultStatus.Forbidden, code);

    public new static Result<T> Conflict(string code, IReadOnlyDictionary<string, string>? parameters = null) =>
        new(default, ResultStatus.Conflict, code, parameters);

    public new static Result<T> Error(string? code = null, IReadOnlyDictionary<string, string>? parameters = null) =>
        new(default, ResultStatus.Error, code, parameters);

    public static Result<T> From(Result result) =>
        new(default, result.Status, result.Code, result.Params, result.ValidationErrors);

    public static implicit operator Result<T>(T value) => Success(value);
}
