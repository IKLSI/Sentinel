using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Sentinel.API.Extensions;

namespace Sentinel.Tests.Configuration;

public class DataProtectionPolicyTests
{
    private static X509Certificate2 SelfSigned()
    {
        using RSA rsa = RSA.Create(2048);

        CertificateRequest request = new CertificateRequest(
            "CN=Sentinel.Tests", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

        return request.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddYears(1));
    }

    private static string PfxWithPrivateKey()
    {
        using X509Certificate2 certificate = SelfSigned();
        return Convert.ToBase64String(certificate.Export(X509ContentType.Pfx));
    }

    private static string PfxWithoutPrivateKey()
    {
        using X509Certificate2 certificate = SelfSigned();
        using X509Certificate2 publicOnly = X509CertificateLoader.LoadCertificate(certificate.Export(X509ContentType.Cert));

        X509Certificate2Collection collection = [publicOnly];

        return Convert.ToBase64String(collection.Export(X509ContentType.Pfx)!);
    }

    private static Action ConfigureWith(string? certBase64)
    {
        Dictionary<string, string?> values = new();

        if (certBase64 != null)
            values["DataProtection:CertBase64"] = certBase64;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();

        return () => new ServiceCollection().AddDataProtectionPolicy(configuration);
    }

    [Fact]
    public void WithoutCertificate_IsRejectedWithExplicitReason()
    {
        ConfigureWith(null).Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*trousseau de clés est écrit en clair dans la base*");
    }

    [Fact]
    public void WithValidCertificate_IsAccepted()
    {
        ConfigureWith(PfxWithPrivateKey()).Should().NotThrow();
    }

    [Fact]
    public void WithNonBase64Certificate_IsRejected()
    {
        ConfigureWith("ceci n'est pas du base64 !!").Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*encodé en base64*");
    }

    [Fact]
    public void WithBase64ThatIsNotAPkcs12_IsRejected()
    {
        string notAPfx = Convert.ToBase64String("même pas un certificat"u8.ToArray());

        ConfigureWith(notAPfx).Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*PKCS#12 valide*");
    }

    [Fact]
    public void WithCertificateMissingItsPrivateKey_IsRejected()
    {
        ConfigureWith(PfxWithoutPrivateKey()).Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*clé privée*");
    }
}
