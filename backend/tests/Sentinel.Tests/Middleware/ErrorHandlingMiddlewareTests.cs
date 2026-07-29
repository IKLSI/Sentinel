using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.API.Middleware;
using Sentinel.Domain.Constants;

namespace Sentinel.Tests.Middleware;

public class ErrorHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_QuandUneOperationInvalideRemonte_RepondUneErreurServeur()
    {
        (int status, string code) = await CaptureAsync(new InvalidOperationException("portée déjà validée"));

        status.Should().Be(StatusCodes.Status500InternalServerError);
        code.Should().Be(ErrorCodes.Unexpected);
    }

    [Fact]
    public async Task InvokeAsync_QuandUneCleEstIntrouvable_RepondUneErreurServeur()
    {
        (int status, string code) = await CaptureAsync(new KeyNotFoundException("entrée absente du dictionnaire"));

        status.Should().Be(StatusCodes.Status500InternalServerError);
        code.Should().Be(ErrorCodes.Unexpected);
    }

    [Fact]
    public async Task InvokeAsync_QuandLaRequeteEstMalFormee_RepondUneErreurClient()
    {
        (int status, string code) = await CaptureAsync(
            new BadHttpRequestException("corps illisible", StatusCodes.Status413PayloadTooLarge));

        status.Should().Be(StatusCodes.Status413PayloadTooLarge);
        code.Should().Be(ErrorCodes.InvalidRequest);
    }

    [Fact]
    public async Task InvokeAsync_QuandUnConflitDeConcurrenceRemonte_RepondUnConflit()
    {
        (int status, string code) = await CaptureAsync(new DbUpdateConcurrencyException("ligne modifiée entre-temps"));

        status.Should().Be(StatusCodes.Status409Conflict);
        code.Should().Be(ErrorCodes.Concurrency);
    }

    [Fact]
    public async Task InvokeAsync_SansException_LaisseLaReponseIntacte()
    {
        DefaultHttpContext context = NewContext();

        ErrorHandlingMiddleware middleware = new ErrorHandlingMiddleware(
            _ => Task.CompletedTask,
            NullLogger<ErrorHandlingMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        context.Response.Body.Length.Should().Be(0);
    }

    private static async Task<(int Status, string Code)> CaptureAsync(Exception exception)
    {
        DefaultHttpContext context = NewContext();

        ErrorHandlingMiddleware middleware = new ErrorHandlingMiddleware(
            _ => throw exception,
            NullLogger<ErrorHandlingMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        context.Response.Body.Position = 0;

        using JsonDocument payload = await JsonDocument.ParseAsync(context.Response.Body);

        return (context.Response.StatusCode, payload.RootElement.GetProperty("code").GetString()!);
    }

    private static DefaultHttpContext NewContext()
    {
        DefaultHttpContext context = new DefaultHttpContext();
        context.Request.Path = "/api/tickets";
        context.Response.Body = new MemoryStream();

        return context;
    }
}
