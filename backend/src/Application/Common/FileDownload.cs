namespace Sentinel.Application.Common;

public sealed record FileDownload(Stream Content, string ContentType, string FileName)
{
    public static FileDownload FromBytes(byte[] content, string contentType, string fileName) =>
        new(new MemoryStream(content), contentType, fileName);
}
