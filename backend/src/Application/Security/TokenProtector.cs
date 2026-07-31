using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;

namespace Sentinel.Application.Security;

public class TokenProtector : ProtectedTokenBase
{
    private const string Purpose = "Sentinel.RepositoryHostTokens.v1";

    public TokenProtector(IDataProtectionProvider provider, ILogger<TokenProtector> logger)
        : base(provider, logger, Purpose)
    {
    }
}
