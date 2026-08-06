using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;

namespace Sentinel.Application.Security;

public abstract class ProtectedTokenBase
{
    private readonly IDataProtector _protector;
    private readonly ILogger _logger;

    protected ProtectedTokenBase(IDataProtectionProvider provider, ILogger logger, string purpose)
    {
        _protector = provider.CreateProtector(purpose);
        _logger = logger;
    }

    public string Protect(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext)) return plaintext;

        return _protector.Protect(plaintext);
    }

    public string? Unprotect(string? ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext)) return ciphertext;

        try
        {
            return _protector.Unprotect(ciphertext);
        }
        catch (CryptographicException ex)
        {
            _logger.LogWarning(ex, "Failed to decrypt a protected token");
            return null;
        }
    }
}
