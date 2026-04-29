using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Models;

namespace Sentinel.Infrastructure.Data;

public class DataSeeder
{
    private readonly SentinelContext _context;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(SentinelContext context, ILogger<DataSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        if (await _context.Organizations.AnyAsync())
            return;

        var now = DateTime.UtcNow;

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Sentinel",
            Slug = "sentinel",
            Timezone = "Europe/Paris",
            CreatedAt = now.AddMonths(-7),
            UpdatedAt = now.AddMonths(-7)
        };

        await _context.Organizations.AddAsync(org);

        var hash = BCrypt.Net.BCrypt.HashPassword("Sentinel2026!");

        var admin = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Email = "admin@sentinel.io",
            PasswordHash = hash,
            FirstName = "Admin",
            LastName = "Sentinel",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = now.AddMonths(-7),
            Theme = "dark"
        };
        var sophie = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Email = "sophie.martin@sentinel.fr",
            PasswordHash = hash,
            FirstName = "Sophie",
            LastName = "Martin",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = now.AddMonths(-7),
            Theme = "dark"
        };
        var julien = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Email = "julien.rousseau@sentinel.fr",
            PasswordHash = hash,
            FirstName = "Julien",
            LastName = "Rousseau",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = now.AddMonths(-7).AddDays(14),
            Theme = "light"
        };
        var thomas = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Email = "thomas.dupont@sentinel.fr",
            PasswordHash = hash,
            FirstName = "Thomas",
            LastName = "Dupont",
            Role = UserRole.Developer,
            IsActive = true,
            CreatedAt = now.AddMonths(-7).AddDays(1),
            Theme = "dark"
        };
        var camille = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Email = "camille.bernard@sentinel.fr",
            PasswordHash = hash,
            FirstName = "Camille",
            LastName = "Bernard",
            Role = UserRole.Developer,
            IsActive = true,
            CreatedAt = now.AddMonths(-6),
            Theme = "dark"
        };
        var antoine = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Email = "antoine.lefebvre@sentinel.fr",
            PasswordHash = hash,
            FirstName = "Antoine",
            LastName = "Lefebvre",
            Role = UserRole.Developer,
            IsActive = true,
            CreatedAt = now.AddMonths(-5),
            Theme = "light"
        };
        await _context.Users.AddRangeAsync(admin, sophie, julien, thomas, camille, antoine);

        var eshop = new TechProject
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Name = "E-Shop Luxe",
            RepositoryUrl = "https://github.com/nexus-digital/eshop-luxe",
            RepositoryType = RepositoryType.GitHub,
            HealthScore = 72,
            HealthGrade = "C",
            ScanFrequency = ScanFrequency.Daily,
            LastScanAt = now.AddDays(-4)
        };
        var bankcore = new TechProject
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Name = "BankCore API",
            RepositoryUrl = "https://gitlab.com/nexus-digital/bankcore-api",
            RepositoryType = RepositoryType.GitLab,
            HealthScore = 88,
            HealthGrade = "B",
            ScanFrequency = ScanFrequency.Daily,
            LastScanAt = now.AddDays(-1)
        };
        var crm = new TechProject
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Name = "CRM SaaS",
            RepositoryUrl = "https://github.com/nexus-digital/crm-saas",
            RepositoryType = RepositoryType.GitHub,
            HealthScore = 55,
            HealthGrade = "D",
            ScanFrequency = ScanFrequency.Daily,
            LastScanAt = now.AddHours(-2)
        };
        await _context.TechProjects.AddRangeAsync(eshop, bankcore, crm);

        await _context.Runtimes.AddRangeAsync(
            new Runtime { Id = Guid.NewGuid(), TechProjectId = eshop.Id, Name = "Node.js", Version = "18.20.3", EolDate = new DateTime(2025, 4, 30, 0, 0, 0, DateTimeKind.Utc), IsEol = true },
            new Runtime { Id = Guid.NewGuid(), TechProjectId = eshop.Id, Name = "React", Version = "18.3.1", IsEol = false },
            new Runtime { Id = Guid.NewGuid(), TechProjectId = bankcore.Id, Name = "Java", Version = "21.0.2", EolDate = new DateTime(2031, 9, 30, 0, 0, 0, DateTimeKind.Utc), IsEol = false },
            new Runtime { Id = Guid.NewGuid(), TechProjectId = bankcore.Id, Name = "Spring Boot", Version = "3.2.4", IsEol = false },
            new Runtime { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "PHP", Version = "8.0.30", EolDate = new DateTime(2023, 11, 26, 0, 0, 0, DateTimeKind.Utc), IsEol = true },
            new Runtime { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "Laravel", Version = "10.48.0", IsEol = false },
            new Runtime { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = ".NET", Version = "8.0.3", EolDate = new DateTime(2026, 11, 10, 0, 0, 0, DateTimeKind.Utc), IsEol = false }
        );

        var lodash = new Dependency { Id = Guid.NewGuid(), TechProjectId = eshop.Id, Name = "lodash", CurrentVersion = "4.17.15", LatestVersion = "4.17.21", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.Vulnerable, ScannedAt = now.AddDays(-4) };
        var jwt = new Dependency { Id = Guid.NewGuid(), TechProjectId = eshop.Id, Name = "jsonwebtoken", CurrentVersion = "8.5.1", LatestVersion = "9.0.2", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.Vulnerable, ScannedAt = now.AddDays(-4) };
        var guzzle = new Dependency { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "guzzlehttp/guzzle", CurrentVersion = "7.8.0", LatestVersion = "7.8.1", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer, Status = DependencyStatus.Vulnerable, ScannedAt = now.AddHours(-2) };

        await _context.Dependencies.AddRangeAsync(
            lodash, jwt,
            new Dependency { Id = Guid.NewGuid(), TechProjectId = eshop.Id, Name = "axios", CurrentVersion = "0.27.2", LatestVersion = "1.6.8", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.MajorUpdate, ScannedAt = now.AddDays(-4) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = eshop.Id, Name = "express", CurrentVersion = "4.18.2", LatestVersion = "4.19.2", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddDays(-4) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = eshop.Id, Name = "react", CurrentVersion = "18.2.0", LatestVersion = "18.3.1", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddDays(-4) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = eshop.Id, Name = "webpack", CurrentVersion = "5.88.0", LatestVersion = "5.90.3", Type = DependencyType.Dev, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddDays(-4) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = bankcore.Id, Name = "spring-security", CurrentVersion = "6.2.2", LatestVersion = "6.2.4", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Maven, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddDays(-1) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = bankcore.Id, Name = "jackson-databind", CurrentVersion = "2.16.1", LatestVersion = "2.17.0", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Maven, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddDays(-1) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = bankcore.Id, Name = "log4j-core", CurrentVersion = "2.22.1", LatestVersion = "2.23.1", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Maven, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddDays(-1) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = bankcore.Id, Name = "postgresql", CurrentVersion = "42.7.2", LatestVersion = "42.7.3", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Maven, Status = DependencyStatus.UpToDate, ScannedAt = now.AddDays(-1) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "laravel/framework", CurrentVersion = "10.48.0", LatestVersion = "11.5.0", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer, Status = DependencyStatus.MajorUpdate, ScannedAt = now.AddHours(-2) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "symfony/http-kernel", CurrentVersion = "6.3.8", LatestVersion = "7.0.6", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer, Status = DependencyStatus.MajorUpdate, ScannedAt = now.AddHours(-2) },
            guzzle,
            new Dependency { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "phpunit/phpunit", CurrentVersion = "10.5.14", LatestVersion = "11.0.6", Type = DependencyType.Dev, Ecosystem = DependencyEcosystem.Composer, Status = DependencyStatus.MajorUpdate, ScannedAt = now.AddHours(-2) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "monolog/monolog", CurrentVersion = "3.5.0", LatestVersion = "3.6.0", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddHours(-2) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "Microsoft.AspNetCore.Authentication.JwtBearer", CurrentVersion = "8.0.3", LatestVersion = "8.0.3", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.NuGet, Status = DependencyStatus.UpToDate, ScannedAt = now.AddDays(-2) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "Npgsql.EntityFrameworkCore.PostgreSQL", CurrentVersion = "8.0.2", LatestVersion = "8.0.4", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.NuGet, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddDays(-2) },
            new Dependency { Id = Guid.NewGuid(), TechProjectId = crm.Id, Name = "Serilog.AspNetCore", CurrentVersion = "8.0.1", LatestVersion = "8.0.1", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.NuGet, Status = DependencyStatus.UpToDate, ScannedAt = now.AddDays(-2) }
        );

        await _context.Vulnerabilities.AddRangeAsync(
            new Vulnerability
            {
                Id = Guid.NewGuid(),
                DependencyId = lodash.Id,
                CveId = "CVE-2020-8203",
                CvssScore = 9.8m,
                Description = "Prototype pollution in lodash before 4.17.20 via merge, mergeWith, defaultsDeep and zipObjectDeep.",
                PackageName = "lodash",
                AffectedVersion = "4.17.15",
                FixedVersion = "4.17.21",
                AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2020-8203",
                Severity = VulnerabilitySeverity.Critical,
                DetectedAt = now.AddDays(-4)
            },
            new Vulnerability
            {
                Id = Guid.NewGuid(),
                DependencyId = jwt.Id,
                CveId = "CVE-2022-23529",
                CvssScore = 9.6m,
                Description = "jsonwebtoken is vulnerable to algorithm confusion when using a public key as HMAC secret.",
                PackageName = "jsonwebtoken",
                AffectedVersion = "8.5.1",
                FixedVersion = "9.0.0",
                AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2022-23529",
                Severity = VulnerabilitySeverity.Critical,
                DetectedAt = now.AddDays(-4)
            },
            new Vulnerability
            {
                Id = Guid.NewGuid(),
                DependencyId = guzzle.Id,
                CveId = "CVE-2023-29197",
                CvssScore = 7.5m,
                Description = "Guzzle forwards sensitive Cookie headers on 3xx redirects, enabling SSRF or session hijacking.",
                PackageName = "guzzlehttp/guzzle",
                AffectedVersion = "7.8.0",
                FixedVersion = "7.8.1",
                AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2023-29197",
                Severity = VulnerabilitySeverity.High,
                DetectedAt = now.AddHours(-2)
            }
        );

        string Tags(params string[] tags) => JsonSerializer.Serialize(tags);

        var t1 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = eshop.Id, Title = "Faille XSS dans le module de commentaires produit", Description = "Une injection XSS stockée a été découverte dans le champ «avis client». Un script malveillant peut être exécuté à la lecture du commentaire par un administrateur.", Priority = TicketPriority.Critical, Type = TicketType.Security, Status = TicketStatus.InProgress, AssignedToId = thomas.Id, EstimatedHours = 8, CreatedById = sophie.Id, CreatedAt = now.AddDays(-5), UpdatedAt = now.AddDays(-4), Tags = Tags("security", "xss", "frontend") };
        var t2 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = eshop.Id, Title = "Erreur 500 lors du paiement avec carte AMEX", Description = "Les paiements par carte American Express échouent avec une erreur 500. Le prestataire retourne un code non géré par le backend.", Priority = TicketPriority.High, Type = TicketType.Bug, Status = TicketStatus.New, AssignedToId = camille.Id, EstimatedHours = 4, CreatedById = sophie.Id, CreatedAt = now.AddDays(-2), UpdatedAt = now.AddDays(-2), Tags = Tags("payment", "amex", "500") };
        var t3 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = eshop.Id, Title = "Page de recherche — résultats tronqués au-delà de 100 articles", Description = "La pagination côté serveur s'arrête à 100 résultats. Les requêtes SQL ignorent le paramètre de page après la première.", Priority = TicketPriority.Medium, Type = TicketType.Bug, Status = TicketStatus.InProgress, AssignedToId = thomas.Id, EstimatedHours = 6, CreatedById = julien.Id, CreatedAt = now.AddDays(-9), UpdatedAt = now.AddDays(-1), Tags = Tags("search", "pagination") };
        var t4 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = eshop.Id, Title = "Ajout du filtre par marque sur la page catalogue", Description = "Ajouter un filtre multi-sélection par marque sur /catalogue. Le filtre met à jour l'URL et reste compatible SEO.", Priority = TicketPriority.Low, Type = TicketType.Feature, Status = TicketStatus.Testing, AssignedToId = antoine.Id, EstimatedHours = 12, CreatedById = julien.Id, CreatedAt = now.AddDays(-14), UpdatedAt = now, Tags = Tags("catalogue", "filter", "feature") };
        var t5 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = eshop.Id, Title = "Lenteur critique sur la page d'accueil (TTFB > 4 s)", Description = "Le TTFB dépasse 4 secondes en heure de pointe. Cause identifiée : requêtes N+1 sur les produits en vedette.", Priority = TicketPriority.High, Type = TicketType.Performance, Status = TicketStatus.Resolved, AssignedToId = thomas.Id, EstimatedHours = 10, CreatedById = sophie.Id, CreatedAt = now.AddDays(-19), UpdatedAt = now.AddDays(-11), Tags = Tags("performance", "homepage", "n+1") };
        var t18 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = eshop.Id, Title = "Balises Open Graph manquantes sur les fiches produit", Description = "Les balises og:image et og:description sont absentes sur les pages produit. Impact sur le partage réseaux sociaux.", Priority = TicketPriority.Low, Type = TicketType.Bug, Status = TicketStatus.Closed, AssignedToId = antoine.Id, EstimatedHours = 3, CreatedById = julien.Id, CreatedAt = now.AddDays(-32), UpdatedAt = now.AddDays(-18), Tags = Tags("seo", "opengraph", "frontend") };

        var t6 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = bankcore.Id, Title = "Injection SQL sur l'endpoint /api/v2/transactions/search", Description = "Paramètre ?q= non sanitisé permettant une injection SQL. Confirmé en staging avec sqlmap.", Priority = TicketPriority.Critical, Type = TicketType.Security, Status = TicketStatus.InProgress, AssignedToId = camille.Id, EstimatedHours = 4, CreatedById = sophie.Id, CreatedAt = now.AddDays(-1).AddHours(-16), UpdatedAt = now.AddDays(-1).AddHours(-10), Tags = Tags("security", "sqli", "api") };
        var t7 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = bankcore.Id, Title = "Tokens JWT expirés acceptés sur les routes secondaires", Description = "Le middleware de validation ne vérifie pas l'expiration sur les endpoints /reports/* et /export/*.", Priority = TicketPriority.High, Type = TicketType.Security, Status = TicketStatus.New, AssignedToId = camille.Id, EstimatedHours = 3, CreatedById = sophie.Id, CreatedAt = now.AddHours(-2), UpdatedAt = now.AddHours(-2), Tags = Tags("security", "jwt", "auth") };
        var t8 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = bankcore.Id, Title = "Export CSV — transactions de décembre manquantes", Description = "L'export CSV du rapport décembre ne contient pas les transactions du 25 au 31. Décalage UTC non géré.", Priority = TicketPriority.Medium, Type = TicketType.Bug, Status = TicketStatus.Testing, AssignedToId = antoine.Id, EstimatedHours = 5, CreatedById = julien.Id, CreatedAt = now.AddDays(-8), UpdatedAt = now.AddDays(-2), Tags = Tags("reporting", "csv", "timezone") };
        var t9 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = bankcore.Id, Title = "Mise à jour documentation Swagger (champs IBAN + statut virement)", Description = "L'API OpenAPI doit refléter les nouveaux champs IBAN masqué et statut de virement ajoutés en janvier.", Priority = TicketPriority.Low, Type = TicketType.Maintenance, Status = TicketStatus.Closed, AssignedToId = antoine.Id, EstimatedHours = 4, CreatedById = julien.Id, CreatedAt = now.AddDays(-27), UpdatedAt = now.AddDays(-14), Tags = Tags("docs", "swagger", "maintenance") };
        var t19 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = bankcore.Id, Title = "Optimisation des index PostgreSQL — table transactions (18 M lignes)", Description = "Requêtes >2 s sur la table transactions. Ajout de 3 index composites identifiés par EXPLAIN ANALYZE.", Priority = TicketPriority.High, Type = TicketType.Performance, Status = TicketStatus.Resolved, AssignedToId = thomas.Id, EstimatedHours = 8, CreatedById = sophie.Id, CreatedAt = now.AddDays(-16), UpdatedAt = now.AddDays(-7), Tags = Tags("performance", "postgres", "index") };

        var t10 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = crm.Id, Title = "Fuite de données inter-tenant sur la recherche de contacts", Description = "Le filtre multi-tenant est absent du ContactSearchController — les contacts du tenant A sont visibles par le tenant B.", Priority = TicketPriority.Critical, Type = TicketType.Security, Status = TicketStatus.InProgress, AssignedToId = thomas.Id, EstimatedHours = 6, CreatedById = sophie.Id, CreatedAt = now.AddDays(-3), UpdatedAt = now.AddDays(-2), Tags = Tags("security", "multitenant", "gdpr") };
        var t11 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = crm.Id, Title = "Import CSV bloqué au-delà de 500 contacts", Description = "L'import échoue silencieusement au-delà de 500 lignes. Pas de feedback utilisateur.", Priority = TicketPriority.High, Type = TicketType.Bug, Status = TicketStatus.New, AssignedToId = null, EstimatedHours = 5, CreatedById = julien.Id, CreatedAt = now.AddHours(-11), UpdatedAt = now.AddHours(-11), Tags = Tags("import", "csv", "contacts") };
        var t12 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = crm.Id, Title = "Pipeline e-mail — 45 min pour 10 000 destinataires", Description = "Optimisation des workers Laravel Horizon pour réduire le temps de traitement du pipeline marketing.", Priority = TicketPriority.Medium, Type = TicketType.Performance, Status = TicketStatus.InProgress, AssignedToId = antoine.Id, EstimatedHours = 8, CreatedById = julien.Id, CreatedAt = now.AddDays(-7), UpdatedAt = now.AddDays(-1), Tags = Tags("performance", "horizon", "email") };
        var t13 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = crm.Id, Title = "Widget «Deals en cours» toujours à zéro depuis la v2.4", Description = "Champ renommé pipeline_stage → deal_stage non répercuté dans le contrôleur de tableau de bord.", Priority = TicketPriority.Medium, Type = TicketType.Bug, Status = TicketStatus.Resolved, AssignedToId = antoine.Id, EstimatedHours = 2, CreatedById = julien.Id, CreatedAt = now.AddDays(-11), UpdatedAt = now.AddDays(-5), Tags = Tags("dashboard", "widget", "deals") };
        var t14 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = crm.Id, Title = "Module congés — jours fériés non pris en compte", Description = "Les demandes chevauchant un jour férié décomptent des jours ouvrés incorrects. Table non mise à jour.", Priority = TicketPriority.High, Type = TicketType.Bug, Status = TicketStatus.InProgress, AssignedToId = camille.Id, EstimatedHours = 6, CreatedById = sophie.Id, CreatedAt = now.AddDays(-6), UpdatedAt = now.AddDays(-3), Tags = Tags("conges", "jours-feries", "rh") };
        var t15 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = crm.Id, Title = "Export SILAE — intégration paie automatisée", Description = "Développer l'export SILAE (CSV v3.1) pour automatiser la transmission des éléments variables de paie.", Priority = TicketPriority.Medium, Type = TicketType.Feature, Status = TicketStatus.New, AssignedToId = null, EstimatedHours = 20, CreatedById = julien.Id, CreatedAt = now.AddDays(1), UpdatedAt = now.AddDays(1), Tags = Tags("paie", "silae", "export", "rh") };
        var t16 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = crm.Id, Title = "Mise à jour .NET 8.0.3 → 8.0.5 (patch sécurité)", Description = "Aucun breaking change identifié. Tests de régression à valider.", Priority = TicketPriority.Low, Type = TicketType.Maintenance, Status = TicketStatus.Testing, AssignedToId = antoine.Id, EstimatedHours = 3, CreatedById = sophie.Id, CreatedAt = now.AddDays(-13), UpdatedAt = now, Tags = Tags("maintenance", "dotnet", "update") };

        var t17 = new Ticket { Id = Guid.NewGuid(), OrganizationId = org.Id, ProjectId = null, Title = "Mise en place d'un environnement de staging mutualisé", Description = "Besoin d'un staging commun aux 4 projets. Devis et procédure CI/CD à définir.", Priority = TicketPriority.Medium, Type = TicketType.Question, Status = TicketStatus.New, AssignedToId = null, EstimatedHours = null, CreatedById = julien.Id, CreatedAt = now.AddDays(-1), UpdatedAt = now.AddDays(-1), Tags = Tags("infra", "staging", "devops") };

        await _context.Tickets.AddRangeAsync(t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15, t16, t17, t18, t19);

        await _context.TicketComments.AddRangeAsync(
            new TicketComment { Id = Guid.NewGuid(), TicketId = t1.Id, AuthorId = sophie.Id, Content = "Confirmé en prod. Vecteur : champ «recommander ce produit». Patch sous 24 h max.", CreatedAt = now.AddDays(-5).AddHours(1.5), UpdatedAt = now.AddDays(-5).AddHours(1.5) },
            new TicketComment { Id = Guid.NewGuid(), TicketId = t1.Id, AuthorId = thomas.Id, Content = "Problème identifié dans ReviewCard.tsx — le contenu n'est pas escapé avant le rendu. Fix avec DOMPurify en cours.", CreatedAt = now.AddDays(-4).AddHours(1.25), UpdatedAt = now.AddDays(-4).AddHours(1.25) },
            new TicketComment { Id = Guid.NewGuid(), TicketId = t6.Id, AuthorId = sophie.Id, Content = "URGENT — signalé par l'équipe sécurité du client. Revue complète des endpoints de recherche demandée.", CreatedAt = now.AddDays(-1).AddHours(-15.5), UpdatedAt = now.AddDays(-1).AddHours(-15.5) },
            new TicketComment { Id = Guid.NewGuid(), TicketId = t6.Id, AuthorId = camille.Id, Content = "Le paramètre ?q= est concaténé directement dans la requête JPQL. Correction via PreparedStatement — PR ouverte.", CreatedAt = now.AddDays(-1).AddHours(-8.5), UpdatedAt = now.AddDays(-1).AddHours(-8.5) },
            new TicketComment { Id = Guid.NewGuid(), TicketId = t10.Id, AuthorId = sophie.Id, Content = "RGPD en jeu. Notification CNIL évaluée avec le DPO. Correctif à déployer avant 20 h ce soir.", CreatedAt = now.AddDays(-3).AddHours(0.75), UpdatedAt = now.AddDays(-3).AddHours(0.75) },
            new TicketComment { Id = Guid.NewGuid(), TicketId = t10.Id, AuthorId = thomas.Id, Content = "Scope Eloquent forTenant() absent sur ContactSearchController. Patch minimal prêt pour déploiement.", CreatedAt = now.AddDays(-2).AddHours(-15.25), UpdatedAt = now.AddDays(-2).AddHours(-15.25) },
            new TicketComment { Id = Guid.NewGuid(), TicketId = t14.Id, AuthorId = camille.Id, Content = "Table des jours fériés non mise à jour. Je la complète et ajoute un seed dans le DbContext.", CreatedAt = now.AddDays(-3).AddHours(-13.5), UpdatedAt = now.AddDays(-3).AddHours(-13.5) },
            new TicketComment { Id = Guid.NewGuid(), TicketId = t5.Id, AuthorId = thomas.Id, Content = "N+1 résolus via eager loading (Include). TTFB redescendu à 320 ms. Métriques prod confirmées.", CreatedAt = now.AddDays(-11).AddHours(-7), UpdatedAt = now.AddDays(-11).AddHours(-7) },
            new TicketComment { Id = Guid.NewGuid(), TicketId = t19.Id, AuthorId = thomas.Id, Content = "3 index composites créés : (user_id, created_at), (status, created_at), (account_id, amount). Temps de requête < 40 ms.", CreatedAt = now.AddDays(-7).AddHours(-7.5), UpdatedAt = now.AddDays(-7).AddHours(-7.5) }
        );

        await _context.TicketHistories.AddRangeAsync(
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t1.Id, UserId = sophie.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-5).AddHours(1) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t1.Id, UserId = sophie.Id, Field = "AssignedToId", OldValue = null, NewValue = "Thomas Dupont", CreatedAt = now.AddDays(-5).AddHours(1) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t3.Id, UserId = julien.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-1).AddHours(1) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t3.Id, UserId = julien.Id, Field = "AssignedToId", OldValue = null, NewValue = "Thomas Dupont", CreatedAt = now.AddDays(-1).AddHours(1) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t4.Id, UserId = antoine.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-9) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t4.Id, UserId = julien.Id, Field = "Status", OldValue = "InProgress", NewValue = "Testing", CreatedAt = now.AddHours(-9) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t5.Id, UserId = sophie.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-19).AddHours(1) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t5.Id, UserId = thomas.Id, Field = "Status", OldValue = "InProgress", NewValue = "Resolved", CreatedAt = now.AddDays(-11).AddHours(-6.5) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t6.Id, UserId = sophie.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-1).AddHours(-10) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t6.Id, UserId = sophie.Id, Field = "AssignedToId", OldValue = null, NewValue = "Camille Bernard", CreatedAt = now.AddDays(-1).AddHours(-10) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t8.Id, UserId = julien.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-5) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t8.Id, UserId = antoine.Id, Field = "Status", OldValue = "InProgress", NewValue = "Testing", CreatedAt = now.AddDays(-2).AddHours(-10) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t9.Id, UserId = antoine.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-24) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t9.Id, UserId = antoine.Id, Field = "Status", OldValue = "InProgress", NewValue = "Resolved", CreatedAt = now.AddDays(-15).AddHours(-8) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t9.Id, UserId = julien.Id, Field = "Status", OldValue = "Resolved", NewValue = "Closed", CreatedAt = now.AddDays(-14).AddHours(-13) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t10.Id, UserId = sophie.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-2).AddHours(-15) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t10.Id, UserId = sophie.Id, Field = "AssignedToId", OldValue = null, NewValue = "Thomas Dupont", CreatedAt = now.AddDays(-2).AddHours(-15) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t12.Id, UserId = antoine.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-5).AddHours(-14) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t13.Id, UserId = antoine.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-7).AddHours(-10) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t13.Id, UserId = antoine.Id, Field = "Status", OldValue = "InProgress", NewValue = "Resolved", CreatedAt = now.AddDays(-5).AddHours(-13.5) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t14.Id, UserId = sophie.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-3) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t16.Id, UserId = antoine.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-10) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t16.Id, UserId = antoine.Id, Field = "Status", OldValue = "InProgress", NewValue = "Testing", CreatedAt = now.AddHours(-13) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t18.Id, UserId = antoine.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-31) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t18.Id, UserId = antoine.Id, Field = "Status", OldValue = "InProgress", NewValue = "Resolved", CreatedAt = now.AddDays(-18).AddHours(-7) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t18.Id, UserId = julien.Id, Field = "Status", OldValue = "Resolved", NewValue = "Closed", CreatedAt = now.AddDays(-18).AddHours(-10) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t19.Id, UserId = sophie.Id, Field = "Status", OldValue = "New", NewValue = "InProgress", CreatedAt = now.AddDays(-15) },
            new TicketHistory { Id = Guid.NewGuid(), TicketId = t19.Id, UserId = thomas.Id, Field = "Status", OldValue = "InProgress", NewValue = "Resolved", CreatedAt = now.AddDays(-7).AddHours(-7) }
        );

        DateOnly D(int offsetDays) => DateOnly.FromDateTime(now.AddDays(offsetDays));

        await _context.TimeEntries.AddRangeAsync(
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t5.Id, TechProjectId = eshop.Id, UserId = thomas.Id, Date = D(-11), DurationMinutes = 480, Comment = "Résolution N+1 — eager loading + deploy", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t19.Id, TechProjectId = bankcore.Id, UserId = thomas.Id, Date = D(-17), DurationMinutes = 360, Comment = "EXPLAIN ANALYZE + création des 3 index", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t19.Id, TechProjectId = bankcore.Id, UserId = thomas.Id, Date = D(-16), DurationMinutes = 120, Comment = "Tests de charge + validation métriques", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t3.Id, TechProjectId = eshop.Id, UserId = thomas.Id, Date = D(-4), DurationMinutes = 180, Comment = "Debug pagination côté serveur", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t3.Id, TechProjectId = eshop.Id, UserId = thomas.Id, Date = D(-3), DurationMinutes = 210, Comment = "Fix requête SQL + tests unitaires", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t1.Id, TechProjectId = eshop.Id, UserId = thomas.Id, Date = D(-5), DurationMinutes = 240, Comment = "Analyse vecteur XSS + reproduction", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t1.Id, TechProjectId = eshop.Id, UserId = thomas.Id, Date = D(-4), DurationMinutes = 300, Comment = "Intégration DOMPurify + tests regression", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t10.Id, TechProjectId = crm.Id, UserId = thomas.Id, Date = D(-2), DurationMinutes = 240, Comment = "Fix scope Eloquent + déploiement patch prod", IsManual = true },

            new TimeEntry { Id = Guid.NewGuid(), TicketId = t6.Id, TechProjectId = bankcore.Id, UserId = camille.Id, Date = D(-1), DurationMinutes = 300, Comment = "Fix injection SQL — PreparedStatement + PR", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t6.Id, TechProjectId = bankcore.Id, UserId = camille.Id, Date = D(0), DurationMinutes = 120, Comment = "Tests de sécurité — validation sqlmap", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t2.Id, TechProjectId = eshop.Id, UserId = camille.Id, Date = D(-2), DurationMinutes = 120, Comment = "Reproduction bug paiement AMEX", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t14.Id, TechProjectId = crm.Id, UserId = camille.Id, Date = D(-3), DurationMinutes = 240, Comment = "Mise à jour table jours fériés", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t14.Id, TechProjectId = crm.Id, UserId = camille.Id, Date = D(-1), DurationMinutes = 180, Comment = "Tests module congés + déploiement staging", IsManual = true },

            new TimeEntry { Id = Guid.NewGuid(), TicketId = t18.Id, TechProjectId = eshop.Id, UserId = antoine.Id, Date = D(-32), DurationMinutes = 180, Comment = "Ajout balises Open Graph — fiches produit", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t4.Id, TechProjectId = eshop.Id, UserId = antoine.Id, Date = D(-9), DurationMinutes = 480, Comment = "Développement composant filtre multi-sélection", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t4.Id, TechProjectId = eshop.Id, UserId = antoine.Id, Date = D(-8), DurationMinutes = 360, Comment = "Compatibilité SEO + mise à jour URL canonique", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t4.Id, TechProjectId = eshop.Id, UserId = antoine.Id, Date = D(-7), DurationMinutes = 240, Comment = "Tests d'intégration filtre", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t8.Id, TechProjectId = bankcore.Id, UserId = antoine.Id, Date = D(-5), DurationMinutes = 300, Comment = "Investigation bug export CSV décembre", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t8.Id, TechProjectId = bankcore.Id, UserId = antoine.Id, Date = D(-2), DurationMinutes = 180, Comment = "Fix timezone UTC + recette client", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t12.Id, TechProjectId = crm.Id, UserId = antoine.Id, Date = D(-7), DurationMinutes = 420, Comment = "Profiling Horizon + optimisation workers", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t13.Id, TechProjectId = crm.Id, UserId = antoine.Id, Date = D(-5), DurationMinutes = 120, Comment = "Fix champ deal_stage", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t16.Id, TechProjectId = crm.Id, UserId = antoine.Id, Date = D(-13), DurationMinutes = 180, Comment = "Update .NET 8.0.5 + tests de régression", IsManual = true },
            new TimeEntry { Id = Guid.NewGuid(), TicketId = t16.Id, TechProjectId = crm.Id, UserId = antoine.Id, Date = D(0), DurationMinutes = 120, Comment = "Recette finale + validation QA", IsManual = true }
        );

        await _context.SaveChangesAsync();
    }
}
