using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;

namespace Sentinel.Application.Security;

public class QueuedTokenProtector : ProtectedTokenBase
{
    private const string Purpose = "Sentinel.QueuedEmailTokens.v1";

    public QueuedTokenProtector(IDataProtectionProvider provider, ILogger<QueuedTokenProtector> logger)
        : base(provider, logger, Purpose)
    {
    }
}
