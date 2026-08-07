namespace Sentinel.Application.Common;

public sealed record StreamedFileDownload(
    Func<Stream, CancellationToken, Task> WriteAsync,
    string ContentType,
    string FileName);
