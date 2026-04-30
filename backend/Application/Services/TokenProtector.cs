using Microsoft.AspNetCore.DataProtection;

namespace Sentinel.Application.Services;

public class TokenProtector
{
    private readonly IDataProtector _protector;

    public TokenProtector(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("Sentinel.OrgTokens.v1");
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
        catch
        {
            return null;
        }
    }
}
