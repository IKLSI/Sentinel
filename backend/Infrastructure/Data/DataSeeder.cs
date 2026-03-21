using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Sentinel.Domain.Models;
using System.Text.Json;

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
        Organization? organization = await _context.Organizations.FirstOrDefaultAsync();

        if (organization == null)
        {
            _logger.LogInformation("Initialisation des données de démonstration...");

            organization = new Organization
            {
                Id = Guid.NewGuid(),
                Name = "Sentinel",
                Slug = "sentinel",
                Timezone = "Europe/Paris",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _context.Organizations.AddAsync(organization);

            // ── Utilisateurs ──────────────────────────────────────────────
            var admin = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Email = "admin@sentinel.io",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Sentinel2026!"),
                FirstName = "Admin",
                LastName = "Sentinel",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-90)
            };
            var thomas = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Email = "thomas.martin@sentinel.io",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Sentinel2026!"),
                FirstName = "Thomas",
                LastName = "Martin",
                Role = UserRole.Developer,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-60)
            };
            var sarah = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Email = "sarah.dupont@sentinel.io",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Sentinel2026!"),
                FirstName = "Sarah",
                LastName = "Dupont",
                Role = UserRole.Developer,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-45)
            };
            await _context.Users.AddRangeAsync(admin, thomas, sarah);

            // ── Projets ───────────────────────────────────────────────────
            var now = DateTime.UtcNow;

            var projectAcme = new TechProject
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Name = "Acme — Plateforme e-commerce",
                RepositoryUrl = "https://github.com/vercel/commerce",
                RepositoryType = RepositoryType.GitHub,
                HealthScore = 22,
                HealthGrade = "F",
                ScanFrequency = ScanFrequency.Daily,
                LastScanAt = now.AddHours(-3)
            };
            var projectErp = new TechProject
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Name = "Solutions Pro — ERP Core",
                RepositoryUrl = "https://gitlab.com/gitlab-org/gitlab",
                RepositoryType = RepositoryType.GitLab,
                HealthScore = 64,
                HealthGrade = "D",
                ScanFrequency = ScanFrequency.Daily,
                LastScanAt = now.AddHours(-8)
            };
            var projectMobile = new TechProject
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Name = "RetailGroup — Application mobile",
                RepositoryUrl = "https://github.com/wordpress-mobile/WordPress-Android",
                RepositoryType = RepositoryType.GitHub,
                HealthScore = 93,
                HealthGrade = "A",
                ScanFrequency = ScanFrequency.Weekly,
                LastScanAt = now.AddDays(-1)
            };
            var projectCrm = new TechProject
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Name = "TechVision — CRM Platform",
                RepositoryUrl = "https://github.com/twentyhq/twenty",
                RepositoryType = RepositoryType.GitHub,
                HealthScore = 14,
                HealthGrade = "F",
                ScanFrequency = ScanFrequency.Daily,
                LastScanAt = now.AddHours(-1)
            };
            await _context.TechProjects.AddRangeAsync(projectAcme, projectErp, projectMobile, projectCrm);

            // ── Tickets ───────────────────────────────────────────────────
            var tickets = new List<Ticket>
            {
                new Ticket
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, ProjectId = projectAcme.Id,
                    Title = "Erreur 500 sur la page panier après déploiement v2.4.1",
                    Description = "Depuis le déploiement v2.4.1, les utilisateurs obtiennent une erreur 500 lors de l'ajout d'un produit au panier. Reproductible à 100% en production sur Chrome et Safari.",
                    Priority = TicketPriority.Critical, Type = TicketType.Bug, Status = TicketStatus.InProgress,
                    AssignedToId = thomas.Id, CreatedById = admin.Id,
                    CreatedAt = now.AddDays(-2), UpdatedAt = now.AddHours(-4),
                    SlaDeadline = now.AddHours(6),
                    Tags = JsonSerializer.Serialize(new[] { "production", "panier", "urgent" })
                },
                new Ticket
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, ProjectId = projectAcme.Id,
                    Title = "LCP > 4s sur mobile — optimisation page produit",
                    Description = "Le Largest Contentful Paint dépasse 4s sur mobile d'après les Core Web Vitals. Identifier les ressources bloquantes et mettre en place le lazy loading.",
                    Priority = TicketPriority.Medium, Type = TicketType.Performance, Status = TicketStatus.New,
                    AssignedToId = sarah.Id, CreatedById = admin.Id,
                    CreatedAt = now.AddDays(-5), UpdatedAt = now.AddDays(-5),
                    SlaDeadline = now.AddDays(3),
                    Tags = JsonSerializer.Serialize(new[] { "performance", "mobile", "core-web-vitals" })
                },
                new Ticket
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, ProjectId = projectAcme.Id,
                    Title = "Mise à jour lodash — CVE-2020-8203 (prototype pollution)",
                    Description = "Vulnérabilité de type prototype pollution détectée dans lodash 4.17.20. Score CVSS 7.4. Mise à jour vers 4.17.21 et tests de régression requis.",
                    Priority = TicketPriority.High, Type = TicketType.Security, Status = TicketStatus.Testing,
                    AssignedToId = thomas.Id, CreatedById = thomas.Id,
                    CreatedAt = now.AddDays(-8), UpdatedAt = now.AddDays(-1),
                    SlaDeadline = now.AddDays(1),
                    Tags = JsonSerializer.Serialize(new[] { "sécurité", "cve", "dépendance" })
                },
                new Ticket
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, ProjectId = projectErp.Id,
                    Title = "Export Excel des rapports mensuels non fonctionnel",
                    Description = "Le bouton 'Exporter en Excel' ne génère aucun fichier depuis la migration .NET 8. Aucune exception visible côté utilisateur. Les logs serveur indiquent un timeout sur ClosedXML.",
                    Priority = TicketPriority.High, Type = TicketType.Bug, Status = TicketStatus.InProgress,
                    AssignedToId = sarah.Id, CreatedById = admin.Id,
                    CreatedAt = now.AddDays(-3), UpdatedAt = now.AddHours(-12),
                    SlaDeadline = now.AddDays(2),
                    Tags = JsonSerializer.Serialize(new[] { "export", "rapports", "closedxml" })
                },
                new Ticket
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, ProjectId = projectErp.Id,
                    Title = "Module gestion des congés — workflow d'approbation",
                    Description = "Nouvelle fonctionnalité demandée par le client : suivi des demandes de congés avec workflow de validation N+1, export PDF et intégration calendrier.",
                    Priority = TicketPriority.Medium, Type = TicketType.Feature, Status = TicketStatus.New,
                    AssignedToId = null, CreatedById = admin.Id,
                    CreatedAt = now.AddDays(-10), UpdatedAt = now.AddDays(-10),
                    SlaDeadline = now.AddDays(15),
                    Tags = JsonSerializer.Serialize(new[] { "fonctionnalité", "congés", "workflow" })
                },
                new Ticket
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, ProjectId = projectMobile.Id,
                    Title = "Crash au démarrage sur Android 12 — Pixel 6",
                    Description = "3 utilisateurs signalent un crash immédiat à l'ouverture de l'app sur Pixel 6 (Android 12). Stack trace : NullPointerException dans MainActivity.onCreate() ligne 87.",
                    Priority = TicketPriority.High, Type = TicketType.Bug, Status = TicketStatus.InProgress,
                    AssignedToId = thomas.Id, CreatedById = admin.Id,
                    CreatedAt = now.AddDays(-1), UpdatedAt = now.AddHours(-2),
                    SlaDeadline = now.AddHours(20),
                    Tags = JsonSerializer.Serialize(new[] { "android", "crash", "pixel" })
                },
                new Ticket
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, ProjectId = projectMobile.Id,
                    Title = "Notifications push silencieuses en background iOS 17",
                    Description = "Les notifications push ne sont pas affichées quand l'app est en arrière-plan sur iOS 17 (iPhone 14/15). Problème lié à la révocation du background mode dans le entitlements.",
                    Priority = TicketPriority.Medium, Type = TicketType.Bug, Status = TicketStatus.Resolved,
                    AssignedToId = sarah.Id, CreatedById = admin.Id,
                    CreatedAt = now.AddDays(-14), UpdatedAt = now.AddDays(-2),
                    SlaDeadline = now.AddDays(-5),
                    Tags = JsonSerializer.Serialize(new[] { "ios", "push", "background" })
                },
                new Ticket
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, ProjectId = projectCrm.Id,
                    Title = "Fuite mémoire PHP-FPM en production — processus > 2 Go",
                    Description = "Le processus PHP-FPM atteint 2 Go de RAM après 6h d'activité, nécessitant un redémarrage manuel toutes les nuits. Identifié sur le worker d'envoi de campagnes email (MailWorker.php).",
                    Priority = TicketPriority.Critical, Type = TicketType.Bug, Status = TicketStatus.InProgress,
                    AssignedToId = thomas.Id, CreatedById = admin.Id,
                    CreatedAt = now.AddHours(-18), UpdatedAt = now.AddHours(-1),
                    SlaDeadline = now.AddHours(6),
                    Tags = JsonSerializer.Serialize(new[] { "production", "mémoire", "php-fpm", "urgent" })
                },
                new Ticket
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, ProjectId = projectCrm.Id,
                    Title = "Migration Laravel 10 → 11 avant fin de support LTS",
                    Description = "Laravel 10 atteint sa fin de support en mars 2026. La migration vers Laravel 11 est estimée à 3-4 jours. Inclut la refonte du système d'authentification et la mise à jour des providers.",
                    Priority = TicketPriority.Medium, Type = TicketType.Maintenance, Status = TicketStatus.New,
                    AssignedToId = null, CreatedById = admin.Id,
                    CreatedAt = now.AddDays(-20), UpdatedAt = now.AddDays(-20),
                    SlaDeadline = now.AddDays(45),
                    Tags = JsonSerializer.Serialize(new[] { "migration", "laravel", "maintenance" })
                }
            };
            await _context.Tickets.AddRangeAsync(tickets);

            // ── Saisies de temps ──────────────────────────────────────────
            var timeEntries = new List<TimeEntry>
            {
                new TimeEntry { Id = Guid.NewGuid(), UserId = thomas.Id, TicketId = tickets[0].Id, Date = DateOnly.FromDateTime(now.AddDays(-2)), DurationMinutes = 120, Comment = "Analyse du bug, reproduction locale, identification de la cause dans le middleware panier", IsManual = true },
                new TimeEntry { Id = Guid.NewGuid(), UserId = thomas.Id, TicketId = tickets[0].Id, Date = DateOnly.FromDateTime(now.AddDays(-1)), DurationMinutes = 90, Comment = "Correction + écriture des tests unitaires", IsManual = true },
                new TimeEntry { Id = Guid.NewGuid(), UserId = sarah.Id, TicketId = tickets[1].Id, Date = DateOnly.FromDateTime(now.AddDays(-4)), DurationMinutes = 180, Comment = "Audit Lighthouse, mise en place lazy loading images et fonts, score LCP 4.1s → 2.3s", IsManual = true },
                new TimeEntry { Id = Guid.NewGuid(), UserId = thomas.Id, TicketId = tickets[2].Id, Date = DateOnly.FromDateTime(now.AddDays(-7)), DurationMinutes = 60, Comment = "Mise à jour lodash 4.17.20 → 4.17.21, tests de régression", IsManual = true },
                new TimeEntry { Id = Guid.NewGuid(), UserId = sarah.Id, TicketId = tickets[3].Id, Date = DateOnly.FromDateTime(now.AddDays(-3)), DurationMinutes = 150, Comment = "Investigation bug export Excel, reproduction en local, logs ClosedXML", IsManual = true },
                new TimeEntry { Id = Guid.NewGuid(), UserId = sarah.Id, TicketId = tickets[3].Id, Date = DateOnly.FromDateTime(now.AddDays(-2)), DurationMinutes = 120, Comment = "Correction timeout ClosedXML, recette avec le client", IsManual = true },
                new TimeEntry { Id = Guid.NewGuid(), UserId = thomas.Id, TicketId = tickets[5].Id, Date = DateOnly.FromDateTime(now.AddDays(-1)), DurationMinutes = 90, Comment = "Reproduction du crash, analyse stack trace NullPointerException", IsManual = true },
                new TimeEntry { Id = Guid.NewGuid(), UserId = thomas.Id, TicketId = tickets[7].Id, Date = DateOnly.FromDateTime(now), DurationMinutes = 120, Comment = "Profilage mémoire PHP-FPM avec Blackfire, identification du worker fautif", IsManual = true },
                new TimeEntry { Id = Guid.NewGuid(), UserId = sarah.Id, TicketId = tickets[6].Id, Date = DateOnly.FromDateTime(now.AddDays(-13)), DurationMinutes = 210, Comment = "Diagnostic background mode iOS 17, correction entitlements + recette sur device réel", IsManual = true }
            };
            await _context.TimeEntries.AddRangeAsync(timeEntries);

            // ── Dépendances ───────────────────────────────────────────────
            var lodashDep = new Dependency
            {
                Id = Guid.NewGuid(), TechProjectId = projectAcme.Id,
                Name = "lodash", CurrentVersion = "4.17.20", LatestVersion = "4.17.21",
                Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.Vulnerable, ScannedAt = now.AddHours(-3)
            };
            var jwtDep = new Dependency
            {
                Id = Guid.NewGuid(), TechProjectId = projectAcme.Id,
                Name = "jsonwebtoken", CurrentVersion = "8.5.1", LatestVersion = "9.0.2",
                Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.Vulnerable, ScannedAt = now.AddHours(-3)
            };
            var vm2Dep = new Dependency
            {
                Id = Guid.NewGuid(), TechProjectId = projectAcme.Id,
                Name = "vm2", CurrentVersion = "3.9.11", LatestVersion = "3.9.19",
                Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.Vulnerable, ScannedAt = now.AddHours(-3)
            };
            var newtonsoftDep = new Dependency
            {
                Id = Guid.NewGuid(), TechProjectId = projectErp.Id,
                Name = "Newtonsoft.Json", CurrentVersion = "13.0.1", LatestVersion = "13.0.3",
                Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.NuGet,
                Status = DependencyStatus.Vulnerable, ScannedAt = now.AddHours(-8)
            };
            var symfonyKernelDep = new Dependency
            {
                Id = Guid.NewGuid(), TechProjectId = projectCrm.Id,
                Name = "symfony/http-kernel", CurrentVersion = "5.4.15", LatestVersion = "5.4.39",
                Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer,
                Status = DependencyStatus.Vulnerable, ScannedAt = now.AddHours(-1)
            };
            var guzzlePsr7Dep = new Dependency
            {
                Id = Guid.NewGuid(), TechProjectId = projectCrm.Id,
                Name = "guzzlehttp/psr7", CurrentVersion = "2.4.1", LatestVersion = "2.6.3",
                Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer,
                Status = DependencyStatus.Vulnerable, ScannedAt = now.AddHours(-1)
            };
            var phpunitDep = new Dependency
            {
                Id = Guid.NewGuid(), TechProjectId = projectCrm.Id,
                Name = "phpunit/phpunit", CurrentVersion = "9.5.10", LatestVersion = "10.5.20",
                Type = DependencyType.Dev, Ecosystem = DependencyEcosystem.Composer,
                Status = DependencyStatus.Vulnerable, ScannedAt = now.AddHours(-1)
            };
            var dependencies = new List<Dependency>
            {
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectAcme.Id, Name = "react", CurrentVersion = "18.2.0", LatestVersion = "18.3.1", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddHours(-3) },
                lodashDep,
                jwtDep,
                vm2Dep,
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectAcme.Id, Name = "next", CurrentVersion = "13.4.0", LatestVersion = "14.2.5", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.MajorUpdate, ScannedAt = now.AddHours(-3) },
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectAcme.Id, Name = "axios", CurrentVersion = "1.6.8", LatestVersion = "1.7.2", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddHours(-3) },
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectErp.Id, Name = "Microsoft.EntityFrameworkCore", CurrentVersion = "8.0.1", LatestVersion = "8.0.7", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.NuGet, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddHours(-8) },
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectErp.Id, Name = "ClosedXML", CurrentVersion = "0.97.0", LatestVersion = "0.102.2", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.NuGet, Status = DependencyStatus.MajorUpdate, ScannedAt = now.AddHours(-8) },
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectErp.Id, Name = "Serilog", CurrentVersion = "3.1.1", LatestVersion = "3.1.1", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.NuGet, Status = DependencyStatus.UpToDate, ScannedAt = now.AddHours(-8) },
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectErp.Id, Name = "BCrypt.Net-Next", CurrentVersion = "4.0.3", LatestVersion = "4.0.3", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.NuGet, Status = DependencyStatus.UpToDate, ScannedAt = now.AddHours(-8) },
                newtonsoftDep,
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectMobile.Id, Name = "react-native", CurrentVersion = "0.73.4", LatestVersion = "0.74.2", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddDays(-1) },
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectMobile.Id, Name = "@react-navigation/native", CurrentVersion = "6.1.9", LatestVersion = "6.1.17", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Npm, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddDays(-1) },
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectCrm.Id, Name = "laravel/framework", CurrentVersion = "10.48.0", LatestVersion = "11.14.0", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer, Status = DependencyStatus.MajorUpdate, ScannedAt = now.AddHours(-1) },
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectCrm.Id, Name = "guzzlehttp/guzzle", CurrentVersion = "7.8.0", LatestVersion = "7.9.2", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer, Status = DependencyStatus.MinorUpdate, ScannedAt = now.AddHours(-1) },
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectCrm.Id, Name = "symfony/http-foundation", CurrentVersion = "6.3.0", LatestVersion = "7.1.2", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer, Status = DependencyStatus.EOL, ScannedAt = now.AddHours(-1) },
                symfonyKernelDep,
                guzzlePsr7Dep,
                phpunitDep,
                new Dependency { Id = Guid.NewGuid(), TechProjectId = projectCrm.Id, Name = "doctrine/orm", CurrentVersion = "2.17.0", LatestVersion = "3.2.1", Type = DependencyType.Prod, Ecosystem = DependencyEcosystem.Composer, Status = DependencyStatus.MajorUpdate, ScannedAt = now.AddHours(-1) }
            };
            await _context.Dependencies.AddRangeAsync(dependencies);

            // ── Vulnérabilités ────────────────────────────────────────────
            var vulnerabilities = new List<Vulnerability>
            {
                new Vulnerability
                {
                    Id = Guid.NewGuid(), DependencyId = lodashDep.Id,
                    CveId = "CVE-2020-8203", CvssScore = 7.4m,
                    Description = "Prototype pollution in lodash before 4.17.21 via the zipObjectDeep function. Allows attackers to modify the Object prototype and cause unexpected behavior.",
                    PackageName = "lodash", AffectedVersion = "< 4.17.21", FixedVersion = "4.17.21",
                    AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2020-8203",
                    Severity = VulnerabilitySeverity.High, DetectedAt = now.AddHours(-3)
                },
                new Vulnerability
                {
                    Id = Guid.NewGuid(), DependencyId = jwtDep.Id,
                    CveId = "CVE-2022-23529", CvssScore = 9.6m,
                    Description = "jsonwebtoken versions <=8.5.1 are vulnerable to Remote Code Execution. If the attacker controls the secretOrPublicKey parameter of jwt.verify(), they can supply a crafted key causing arbitrary code execution on the server.",
                    PackageName = "jsonwebtoken", AffectedVersion = "<= 8.5.1", FixedVersion = "9.0.0",
                    AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2022-23529",
                    Severity = VulnerabilitySeverity.Critical, DetectedAt = now.AddHours(-3)
                },
                new Vulnerability
                {
                    Id = Guid.NewGuid(), DependencyId = vm2Dep.Id,
                    CveId = "CVE-2023-29017", CvssScore = 9.8m,
                    Description = "vm2 <= 3.9.14 contains a critical sandbox escape vulnerability. A threat actor can bypass sandbox protections and gain remote code execution rights on the host, even when the 'unsafe' option is disabled.",
                    PackageName = "vm2", AffectedVersion = "<= 3.9.14", FixedVersion = "3.9.15",
                    AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2023-29017",
                    Severity = VulnerabilitySeverity.Critical, DetectedAt = now.AddHours(-3)
                },
                new Vulnerability
                {
                    Id = Guid.NewGuid(), DependencyId = newtonsoftDep.Id,
                    CveId = "CVE-2024-21907", CvssScore = 7.5m,
                    Description = "Newtonsoft.Json before 13.0.2 is vulnerable to Denial of Service. Improper handling of deeply nested objects causes a StackOverflowException that terminates the application process.",
                    PackageName = "Newtonsoft.Json", AffectedVersion = "< 13.0.2", FixedVersion = "13.0.2",
                    AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2024-21907",
                    Severity = VulnerabilitySeverity.High, DetectedAt = now.AddHours(-8)
                },
                new Vulnerability
                {
                    Id = Guid.NewGuid(), DependencyId = symfonyKernelDep.Id,
                    CveId = "CVE-2022-24894", CvssScore = 8.8m,
                    Description = "symfony/http-kernel < 5.4.20 stores cookie headers in the AbstractHttpKernel. Attackers can potentially retrieve and misuse sensitive headers from the response cache, including CSRF tokens and session cookies.",
                    PackageName = "symfony/http-kernel", AffectedVersion = "< 5.4.20", FixedVersion = "5.4.20",
                    AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2022-24894",
                    Severity = VulnerabilitySeverity.High, DetectedAt = now.AddHours(-1)
                },
                new Vulnerability
                {
                    Id = Guid.NewGuid(), DependencyId = guzzlePsr7Dep.Id,
                    CveId = "CVE-2023-29197", CvssScore = 7.5m,
                    Description = "guzzlehttp/psr7 before 2.4.5 is vulnerable to improper HTTP header parsing. Specially crafted headers can trigger a host header injection, allowing attackers to manipulate request routing.",
                    PackageName = "guzzlehttp/psr7", AffectedVersion = "< 2.4.5", FixedVersion = "2.4.5",
                    AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2023-29197",
                    Severity = VulnerabilitySeverity.High, DetectedAt = now.AddHours(-1)
                },
                new Vulnerability
                {
                    Id = Guid.NewGuid(), DependencyId = phpunitDep.Id,
                    CveId = "CVE-2022-24828", CvssScore = 8.1m,
                    Description = "phpunit/phpunit < 9.5.24 is vulnerable to Argument Injection. Maliciously crafted test annotations can inject arbitrary arguments into test commands, enabling remote code execution in CI/CD pipelines.",
                    PackageName = "phpunit/phpunit", AffectedVersion = "< 9.5.24", FixedVersion = "9.5.24",
                    AdvisoryUrl = "https://nvd.nist.gov/vuln/detail/CVE-2022-24828",
                    Severity = VulnerabilitySeverity.High, DetectedAt = now.AddHours(-1)
                }
            };
            await _context.Vulnerabilities.AddRangeAsync(vulnerabilities);

            // ── Runtimes ──────────────────────────────────────────────────
            var runtimes = new List<Runtime>
            {
                new Runtime { Id = Guid.NewGuid(), TechProjectId = projectAcme.Id, Name = "Node.js", Version = "18.19.0", EolDate = new DateTime(2025, 4, 30, 0, 0, 0, DateTimeKind.Utc), IsEol = false },
                new Runtime { Id = Guid.NewGuid(), TechProjectId = projectErp.Id, Name = ".NET", Version = "8.0", EolDate = new DateTime(2026, 11, 10, 0, 0, 0, DateTimeKind.Utc), IsEol = false },
                new Runtime { Id = Guid.NewGuid(), TechProjectId = projectMobile.Id, Name = "Node.js", Version = "20.14.0", EolDate = new DateTime(2026, 4, 30, 0, 0, 0, DateTimeKind.Utc), IsEol = false },
                new Runtime { Id = Guid.NewGuid(), TechProjectId = projectCrm.Id, Name = "PHP", Version = "8.1.29", EolDate = new DateTime(2025, 12, 31, 0, 0, 0, DateTimeKind.Utc), IsEol = false }
            };
            await _context.Runtimes.AddRangeAsync(runtimes);

            // ── Factures ──────────────────────────────────────────────────
            var invoices = new List<Invoice>
            {
                new Invoice
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, TechProjectId = projectAcme.Id,
                    Label = "TMA Juin 2025 — Acme Plateforme e-commerce", Period = "2025-06",
                    TotalHours = 34.5m, DailyRate = 650m, TotalAmount = Math.Round(34.5m / 8m * 650m, 2),
                    TaxRate = 20m, InvoiceNumber = 2025001, Status = InvoiceStatus.Paid,
                    IssuedAt = now.AddDays(-50), DueAt = now.AddDays(-20), PaidAt = now.AddDays(-15)
                },
                new Invoice
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, TechProjectId = projectErp.Id,
                    Label = "TMA Juin 2025 — Solutions Pro ERP Core", Period = "2025-06",
                    TotalHours = 28m, DailyRate = 700m, TotalAmount = Math.Round(28m / 8m * 700m, 2),
                    TaxRate = 20m, InvoiceNumber = 2025002, Status = InvoiceStatus.Sent,
                    IssuedAt = now.AddDays(-20), DueAt = now.AddDays(10)
                },
                new Invoice
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, TechProjectId = projectMobile.Id,
                    Label = "TMA Juin 2025 — RetailGroup Application mobile", Period = "2025-06",
                    TotalHours = 21.5m, DailyRate = 680m, TotalAmount = Math.Round(21.5m / 8m * 680m, 2),
                    TaxRate = 20m, InvoiceNumber = 2025003, Status = InvoiceStatus.Paid,
                    IssuedAt = now.AddDays(-48), DueAt = now.AddDays(-18), PaidAt = now.AddDays(-12)
                },
                new Invoice
                {
                    Id = Guid.NewGuid(), OrganizationId = organization.Id, TechProjectId = projectCrm.Id,
                    Label = "TMA Juillet 2025 — TechVision CRM Platform", Period = "2025-07",
                    TotalHours = 0m, DailyRate = 680m, TotalAmount = 0m,
                    TaxRate = 20m, InvoiceNumber = 2025004, Status = InvoiceStatus.Draft,
                    IssuedAt = now, DueAt = now.AddDays(30)
                }
            };
            await _context.Invoices.AddRangeAsync(invoices);

            await _context.SaveChangesAsync();
            _logger.LogInformation("Données de démonstration initialisées. Admin: admin@sentinel.io / Sentinel2026!");
        }
    }
}
