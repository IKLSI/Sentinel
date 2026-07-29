using Sentinel.Domain.Abstractions;

namespace Sentinel.API.Services;

public class ContentPathProvider : IContentPathProvider
{
    public ContentPathProvider(IWebHostEnvironment environment)
    {
        ContentRootPath = environment.ContentRootPath;
    }

    public string ContentRootPath { get; }
}
