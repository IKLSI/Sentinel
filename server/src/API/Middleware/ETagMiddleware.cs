using System.Security.Cryptography;

namespace Sentinel.API.Middleware;

public class ETagMiddleware
{
    private const int MaxBufferedBytes = 84 * 1024;
    private const string JsonContentType = "application/json";
    private const int ETagHexLength = 32;

    private readonly RequestDelegate _next;

    public ETagMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!HttpMethods.IsGet(context.Request.Method))
        {
            await _next(context);
            return;
        }

        Stream originalBody = context.Response.Body;
        await using EtagCaptureStream capture = new EtagCaptureStream(originalBody, MaxBufferedBytes,
            () => IsCacheable(context));
        context.Response.Body = capture;

        try
        {
            await _next(context);

            if (capture.CapturedBody is not { } payload
                || payload.Length == 0
                || !IsCacheable(context))
            {
                await capture.FlushBufferedAsync(context.RequestAborted);
                return;
            }

            byte[] hash = SHA256.HashData(payload.Span);
            string etag = $"\"{Convert.ToHexString(hash)[..ETagHexLength]}\"";

            context.Response.Headers.ETag = etag;
            context.Response.Headers.CacheControl = "private, no-cache";

            if (context.Request.Headers.IfNoneMatch.ToString() == etag)
            {
                context.Response.StatusCode = StatusCodes.Status304NotModified;
                context.Response.ContentLength = 0;

                return;
            }

            await originalBody.WriteAsync(payload, context.RequestAborted);
        }
        finally
        {
            context.Response.Body = originalBody;
        }
    }

    private static bool IsCacheable(HttpContext context) =>
        context.Response.StatusCode == StatusCodes.Status200OK
        && !context.Response.Headers.ContainsKey("ETag")
        && IsJson(context.Response.ContentType);

    private static bool IsJson(string? contentType) =>
        contentType is not null && contentType.StartsWith(JsonContentType, StringComparison.OrdinalIgnoreCase);

    private sealed class EtagCaptureStream : Stream
    {
        private readonly Stream _target;
        private readonly int _maxBufferedBytes;
        private readonly Func<bool> _shouldCapture;
        private MemoryStream? _buffer;
        private bool _decided;

        public EtagCaptureStream(Stream target, int maxBufferedBytes, Func<bool> shouldCapture)
        {
            _target = target;
            _maxBufferedBytes = maxBufferedBytes;
            _shouldCapture = shouldCapture;
        }

        public ReadOnlyMemory<byte>? CapturedBody =>
            _buffer is null ? null : _buffer.GetBuffer().AsMemory(0, (int)_buffer.Length);

        private void DecideOnFirstWrite()
        {
            if (_decided) return;

            _decided = true;

            if (_shouldCapture()) _buffer = new MemoryStream();
        }

        public override bool CanRead => false;
        public override bool CanSeek => false;
        public override bool CanWrite => true;
        public override long Length => throw new NotSupportedException();

        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public async Task FlushBufferedAsync(CancellationToken cancellationToken)
        {
            if (CapturedBody is not { Length: > 0 } body) return;

            await _target.WriteAsync(body, cancellationToken);
        }

        public override async ValueTask WriteAsync(ReadOnlyMemory<byte> source,
            CancellationToken cancellationToken = default)
        {
            DecideOnFirstWrite();

            if (_buffer is not null)
            {
                if (_buffer.Length + source.Length <= _maxBufferedBytes)
                {
                    _buffer.Write(source.Span);
                    return;
                }

                await _target.WriteAsync(_buffer.GetBuffer().AsMemory(0, (int)_buffer.Length), cancellationToken);
                _buffer.Dispose();
                _buffer = null;
            }

            await _target.WriteAsync(source, cancellationToken);
        }

        public override Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
            WriteAsync(buffer.AsMemory(offset, count), cancellationToken).AsTask();

        public override void Write(byte[] buffer, int offset, int count)
        {
            DecideOnFirstWrite();

            if (_buffer is not null)
            {
                if (_buffer.Length + count <= _maxBufferedBytes)
                {
                    _buffer.Write(buffer, offset, count);
                    return;
                }

                _target.Write(_buffer.GetBuffer(), 0, (int)_buffer.Length);
                _buffer.Dispose();
                _buffer = null;
            }

            _target.Write(buffer, offset, count);
        }

        public override void Flush()
        {
            DecideOnFirstWrite();

            if (_buffer is null) _target.Flush();
        }

        public override Task FlushAsync(CancellationToken cancellationToken)
        {
            DecideOnFirstWrite();

            return _buffer is null ? _target.FlushAsync(cancellationToken) : Task.CompletedTask;
        }

        public override int Read(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

        public override void SetLength(long value) => throw new NotSupportedException();

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _buffer?.Dispose();
                _buffer = null;
            }

            base.Dispose(disposing);
        }
    }
}
