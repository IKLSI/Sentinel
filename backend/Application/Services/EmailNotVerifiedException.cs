namespace Sentinel.Application.Services;

public class EmailNotVerifiedException : Exception
{
    public EmailNotVerifiedException(string message) : base(message) { }
}
