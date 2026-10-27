using FluentAssertions;
using Sentinel.Application.Compliance;
using Sentinel.Application.Exports;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Entities;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class ComplianceReportTests
{
    private static readonly byte[] PdfSignature = "%PDF"u8.ToArray();

    static ComplianceReportTests()
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
    }

    [Theory]
    [InlineData(LanguageValues.Fr, "Rapport de traçabilité des dépendances", "Collecté", "rapport-tracabilite")]
    [InlineData(LanguageValues.En, "Dependency traceability report", "Collected", "traceability-report")]
    public void Labels_ResolventLesLibellesDeLaLangueDeLUtilisateur(string culture, string title, string covered,
        string slug)
    {
        ComplianceReportLabels labels = new(BuildLocalizer(), culture);

        labels.Title.Should().Be(title);
        labels.StatusCovered.Should().Be(covered);
        labels.Slug.Should().Be(slug);
    }

    [Fact]
    public void Labels_InjectentLeNombreDansLesTitresDeSection()
    {
        ComplianceReportLabels labels = new(BuildLocalizer(), LanguageValues.Fr);

        labels.SectionVulnerabilities(4).Should().Be("Vulnérabilités détectées (4)");
        labels.VulnerabilitiesHidden(7).Should().Contain("7");
    }

    [Fact]
    public void ResolveCulture_QuandLaLangueEstInconnue_RetombeSurLeFrancais()
    {
        ComplianceReportLabels.ResolveCulture("de-DE").Should().Be(LanguageValues.Fr);
        ComplianceReportLabels.ResolveCulture(null).Should().Be(LanguageValues.Fr);
        ComplianceReportLabels.ResolveCulture(LanguageValues.En).Should().Be(LanguageValues.En);
    }

    [Theory]
    [InlineData(LanguageValues.Fr, "rapport-tracabilite-mon-projet.pdf")]
    [InlineData(LanguageValues.En, "traceability-report-mon-projet.pdf")]
    public async Task GenerateAsync_ProduitUnPdfNommeDansLaLangueDeLUtilisateur(string language, string fileName)
    {
        using TestScope scope = new TestScope();

        await scope.SeedAsync(scope.NewOrganization());
        await scope.SeedAsync(NewUser(scope.OrganizationId, scope.UserId, language));

        Project project = new()
        {
            Id = Guid.NewGuid(),
            OrganizationId = scope.OrganizationId,
            Name = "Mon Projet",
            RepositoryUrl = "https://github.com/ftel/sentinel",
            RepositoryType = RepositoryType.GitHub,
            ScanFrequency = ScanFrequency.Weekly,
            HealthScore = 82,
            HealthGrade = "B"
        };

        await scope.SeedAsync(project);

        ComplianceReportService sut = new(scope.Projects, scope.Organizations, scope.Users, scope.AuditLogs,
            BuildLocalizer());

        ExportResult? result = await sut.GenerateAsync(project.Id, scope.OrganizationId, scope.UserId,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.FileName.Should().Be(fileName);
        result.Content.Take(PdfSignature.Length).Should().BeEquivalentTo(PdfSignature);
    }

    [Fact]
    public async Task GenerateAsync_QuandLeProjetAppartientAUneAutreOrganisation_RetourneNull()
    {
        using TestScope scope = new TestScope();

        await scope.SeedAsync(scope.NewOrganization());
        await scope.SeedAsync(NewUser(scope.OrganizationId, scope.UserId, LanguageValues.Fr));

        ComplianceReportService sut = new(scope.Projects, scope.Organizations, scope.Users, scope.AuditLogs,
            BuildLocalizer());

        ExportResult? result = await sut.GenerateAsync(Guid.NewGuid(), scope.OrganizationId, scope.UserId,
            CancellationToken.None);

        result.Should().BeNull();
    }

    private static ILocalizer BuildLocalizer() => TestLocalizer.Create();

    private static User NewUser(Guid organizationId, Guid userId, string language) => new()
    {
        Id = userId,
        OrganizationId = organizationId,
        Email = "membre@test.fr",
        FirstName = "Membre",
        LastName = "Test",
        PasswordHash = "hash",
        Role = UserRole.Developer,
        AccessStatus = UserAccessStatus.Active,
        Language = language
    };
}
