using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using Sentinel.Application.Common;

namespace Sentinel.API.Results;

public sealed class StreamedFileResult(StreamedFileDownload download) : ActionResult
{
    public override async Task ExecuteResultAsync(ActionContext context)
    {
        HttpResponse response = context.HttpContext.Response;
        ContentDispositionHeaderValue contentDisposition = new("attachment");
        contentDisposition.SetHttpFileName(download.FileName);

        response.ContentType = download.ContentType;
        response.Headers.ContentDisposition = contentDisposition.ToString();
        context.HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();

        await download.WriteAsync(response.Body, context.HttpContext.RequestAborted);
    }
}
