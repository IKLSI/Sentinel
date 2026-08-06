using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Sentinel.API.Middleware;

namespace Sentinel.Tests.Middleware;

public class ETagMiddlewareTests
{
    private const string JsonContentType = "application/json";

    [Fact]
    public async Task InvokeAsync_QuandLaReponseEstUnPetitJson_AjouteUnETag()
    {
        (HttpContext context, MemoryStream body) = await ExecuteAsync(JsonContentType, """{"valeur":1}""");

        context.Response.Headers.ETag.ToString().Should().NotBeEmpty();
        Encoding.UTF8.GetString(body.ToArray()).Should().Be("""{"valeur":1}""");
    }

    [Fact]
    public async Task InvokeAsync_QuandLaReponseNEstPasDuJson_NAjoutePasDETag()
    {
        (HttpContext context, MemoryStream body) = await ExecuteAsync("application/pdf", "%PDF-1.4 contenu");

        context.Response.Headers.ETag.ToString().Should().BeEmpty();
        Encoding.UTF8.GetString(body.ToArray()).Should().Be("%PDF-1.4 contenu");
    }

    [Fact]
    public async Task InvokeAsync_QuandLaReponseDepasseLaTailleTamponnee_NAjoutePasDETagEtTransmetTout()
    {
        string payload = new string('a', 300 * 1024);

        (HttpContext context, MemoryStream body) = await ExecuteAsync(JsonContentType, payload);

        context.Response.Headers.ETag.ToString().Should().BeEmpty();
        body.Length.Should().Be(payload.Length);
    }

    [Fact]
    public async Task InvokeAsync_QuandLETagCorrespondAuIfNoneMatch_Repond304()
    {
        const string content = """{"valeur":1}""";

        (HttpContext premier, _) = await ExecuteAsync(JsonContentType, content);
        string etag = premier.Response.Headers.ETag.ToString();

        (HttpContext second, MemoryStream body) = await ExecuteAsync(JsonContentType, content, etag);

        second.Response.StatusCode.Should().Be(StatusCodes.Status304NotModified);
        body.Length.Should().Be(0);
    }

    [Fact]
    public async Task InvokeAsync_QuandLaReponseNEstPasDuJson_TransmetChaqueEcritureSansTamponner()
    {
        DefaultHttpContext context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Get;

        ObservableStream body = new ObservableStream();
        context.Response.Body = body;

        int bytesEcritsAvantLaFin = -1;

        ETagMiddleware middleware = new ETagMiddleware(async httpContext =>
        {
            httpContext.Response.StatusCode = StatusCodes.Status200OK;
            httpContext.Response.ContentType = "text/event-stream";

            await httpContext.Response.Body.WriteAsync(Encoding.UTF8.GetBytes("data: 1\n\n"));
            await httpContext.Response.Body.FlushAsync();

            bytesEcritsAvantLaFin = (int)body.Length;
        });

        await middleware.InvokeAsync(context);

        bytesEcritsAvantLaFin.Should().Be(9);
        body.FlushCount.Should().Be(1);
    }

    [Fact]
    public async Task InvokeAsync_QuandLaReponseEstDejaEtaguee_NeRemplacePasLETag()
    {
        DefaultHttpContext context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Get;
        context.Response.Body = new MemoryStream();

        ETagMiddleware middleware = new ETagMiddleware(async httpContext =>
        {
            httpContext.Response.StatusCode = StatusCodes.Status200OK;
            httpContext.Response.ContentType = JsonContentType;
            httpContext.Response.Headers.ETag = "\"existant\"";

            await httpContext.Response.Body.WriteAsync(Encoding.UTF8.GetBytes("""{"valeur":1}"""));
        });

        await middleware.InvokeAsync(context);

        context.Response.Headers.ETag.ToString().Should().Be("\"existant\"");
    }

    private sealed class ObservableStream : MemoryStream
    {
        public int FlushCount { get; private set; }

        public override Task FlushAsync(CancellationToken cancellationToken)
        {
            FlushCount++;
            return base.FlushAsync(cancellationToken);
        }
    }

    private static async Task<(HttpContext Context, MemoryStream Body)> ExecuteAsync(
        string contentType, string content, string? ifNoneMatch = null)
    {
        DefaultHttpContext context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Get;

        if (ifNoneMatch is not null)
            context.Request.Headers.IfNoneMatch = ifNoneMatch;

        MemoryStream body = new MemoryStream();
        context.Response.Body = body;

        ETagMiddleware middleware = new ETagMiddleware(async httpContext =>
        {
            httpContext.Response.StatusCode = StatusCodes.Status200OK;
            httpContext.Response.ContentType = contentType;

            await httpContext.Response.Body.WriteAsync(Encoding.UTF8.GetBytes(content));
        });

        await middleware.InvokeAsync(context);

        return (context, body);
    }
}
