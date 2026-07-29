using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;

namespace Sentinel.Application.Services;

public class TokenProtector
{
    private const string Purpose = "Sentinel.RepositoryHostTokens.v1";

    private readonly IDataProtector _protector;
    private readonly ILogger<TokenProtector> _logger;

    public TokenProtector(IDataProtectionProvider provider, ILogger<TokenProtector> logger)
    {
        _protector = provider.CreateProtector(Purpose);
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
            _logger.LogWarning(ex, "Échec du déchiffrement d'un token protégé");
            return null;
        }
    }
}
