using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;

namespace Sentinel.Application.Security;

public class TokenProtector(IDataProtectionProvider provider, ILogger<TokenProtector> logger)
    : ProtectedTokenBase(provider, logger, Purpose)
{
    private const string Purpose = "Sentinel.RepositoryHostTokens.v1";
}
