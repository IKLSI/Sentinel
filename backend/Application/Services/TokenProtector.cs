using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Sentinel.Application.Services;

public class TokenProtector
{
    private readonly byte[] _key;

    public TokenProtector(IConfiguration configuration)
    {
        string? keyString = configuration["Encryption:Key"]
            ?? throw new InvalidOperationException("Encryption:Key est requis dans la configuration.");
        _key = Convert.FromBase64String(keyString);
        if (_key.Length != 32)
            throw new InvalidOperationException("Encryption:Key doit être une clé base64 de 32 octets.");
    }

    public string Protect(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext)) return plaintext;

        byte[] nonce = new byte[AesGcm.NonceByteSizes.MaxSize];
        RandomNumberGenerator.Fill(nonce);

        byte[] plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        byte[] ciphertext = new byte[plaintextBytes.Length];
        byte[] tag = new byte[AesGcm.TagByteSizes.MaxSize];

        using var aes = new AesGcm(_key, AesGcm.TagByteSizes.MaxSize);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        byte[] result = new byte[nonce.Length + tag.Length + ciphertext.Length];
        nonce.CopyTo(result, 0);
        tag.CopyTo(result, nonce.Length);
        ciphertext.CopyTo(result, nonce.Length + tag.Length);

        return Convert.ToBase64String(result);
    }

    public string? Unprotect(string? ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext)) return ciphertext;
        try
        {
            byte[] data = Convert.FromBase64String(ciphertext);

            int nonceSize = AesGcm.NonceByteSizes.MaxSize;
            int tagSize = AesGcm.TagByteSizes.MaxSize;

            if (data.Length < nonceSize + tagSize) return null;

            byte[] nonce = data[..nonceSize];
            byte[] tag = data[nonceSize..(nonceSize + tagSize)];
            byte[] encrypted = data[(nonceSize + tagSize)..];
            byte[] plaintext = new byte[encrypted.Length];

            using var aes = new AesGcm(_key, tagSize);
            aes.Decrypt(nonce, encrypted, tag, plaintext);

            return Encoding.UTF8.GetString(plaintext);
        }
        catch
        {
            return null;
        }
    }
}
