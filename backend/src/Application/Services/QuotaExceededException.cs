namespace Sentinel.Application.Services;

public class QuotaExceededException : Exception
{
    public QuotaExceededException(string message) : base(message) { }
}
