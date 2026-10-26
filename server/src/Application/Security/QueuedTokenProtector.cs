using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;

namespace Sentinel.Application.Security;

public class QueuedTokenProtector(IDataProtectionProvider provider, ILogger<QueuedTokenProtector> logger)
    : ProtectedTokenBase(provider, logger, Purpose)
{
    private const string Purpose = "Sentinel.QueuedEmailTokens.v1";
}
