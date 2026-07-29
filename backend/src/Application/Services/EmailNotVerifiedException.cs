using Sentinel.Domain.Constants;

namespace Sentinel.Application.Services;

public class EmailNotVerifiedException : TranslatableException
{
    public EmailNotVerifiedException() : base(ErrorCodes.AuthEmailNotVerified) { }
}
