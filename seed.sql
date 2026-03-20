-- =============================================================================
-- TMAflow — Seed de démonstration
-- Effet  : remet à zéro toutes les tables et injecte des données réalistes.
-- Comptes: tous les mots de passe = TMAflow2026!
-- =============================================================================

BEGIN;

-- ── Nettoyage (ordre inverse des FK) ─────────────────────────────────────────
TRUNCATE TABLE
    "TicketHistories", "TicketComments", "TimeEntries",
    "Vulnerabilities", "Runtimes", "Dependencies",
    "Invoices", "Tickets",
    "Users", "TechProjects", "Organizations"
CASCADE;

-- ── Organisation ─────────────────────────────────────────────────────────────
INSERT INTO "Organizations" ("Id","Name","Slug","Timezone","CreatedAt","UpdatedAt") VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Nexus Digital',
    'nexus-digital',
    'Europe/Paris',
    '2025-09-01 08:00:00+00',
    '2025-09-01 08:00:00+00'
);

-- ── Utilisateurs ─────────────────────────────────────────────────────────────
-- Hash BCrypt(11) pour TMAflow2026!
INSERT INTO "Users" (
    "Id","OrganizationId","Email","PasswordHash",
    "FirstName","LastName","Role","IsActive","CreatedAt","Theme"
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'admin@tmaflow.io',
    '$2a$11$pXhITXhq4X6CilhhN7FD5eWVfJ5dz/uXNu9Zh89Lw9OYzg9dbUOxG',
    'Admin','TMAflow','Admin',true,'2025-09-01 08:00:00+00','dark'
),
(
    '10000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'sophie.martin@nexus-digital.fr',
    '$2a$11$pXhITXhq4X6CilhhN7FD5eWVfJ5dz/uXNu9Zh89Lw9OYzg9dbUOxG',
    'Sophie','Martin','Manager',true,'2025-09-01 09:00:00+00','dark'
),
(
    '10000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'julien.rousseau@nexus-digital.fr',
    '$2a$11$pXhITXhq4X6CilhhN7FD5eWVfJ5dz/uXNu9Zh89Lw9OYzg9dbUOxG',
    'Julien','Rousseau','Manager',true,'2025-09-15 09:00:00+00','light'
),
(
    '10000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'thomas.dupont@nexus-digital.fr',
    '$2a$11$pXhITXhq4X6CilhhN7FD5eWVfJ5dz/uXNu9Zh89Lw9OYzg9dbUOxG',
    'Thomas','Dupont','Developer',true,'2025-09-02 09:00:00+00','dark'
),
(
    '10000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'camille.bernard@nexus-digital.fr',
    '$2a$11$pXhITXhq4X6CilhhN7FD5eWVfJ5dz/uXNu9Zh89Lw9OYzg9dbUOxG',
    'Camille','Bernard','Developer',true,'2025-10-01 09:00:00+00','dark'
),
(
    '10000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'antoine.lefebvre@nexus-digital.fr',
    '$2a$11$pXhITXhq4X6CilhhN7FD5eWVfJ5dz/uXNu9Zh89Lw9OYzg9dbUOxG',
    'Antoine','Lefebvre','Developer',true,'2025-11-03 09:00:00+00','light'
);

-- ── Projets techniques ────────────────────────────────────────────────────────
INSERT INTO "TechProjects" (
    "Id","OrganizationId","Name","RepositoryUrl",
    "RepositoryType","LastScanAt","HealthScore","HealthGrade","ScanFrequency"
) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'E-Shop Luxe',
    'https://github.com/nexus-digital/eshop-luxe',
    'GitHub','2026-03-15 02:00:00+00',72,'C','Daily'
),
(
    '20000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'BankCore API',
    'https://gitlab.com/nexus-digital/bankcore-api',
    'GitLab','2026-03-18 02:00:00+00',88,'B','Daily'
),
(
    '20000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'CRM SaaS',
    'https://github.com/nexus-digital/crm-saas',
    'GitHub','2026-03-19 02:00:00+00',55,'D','Daily'
),
(
    '20000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Portail RH',
    'https://bitbucket.org/nexus-digital/portail-rh',
    'Bitbucket','2026-03-17 02:00:00+00',95,'A','Weekly'
);

-- ── Runtimes ──────────────────────────────────────────────────────────────────
INSERT INTO "Runtimes" ("Id","TechProjectId","Name","Version","EolDate","IsEol") VALUES
-- E-Shop Luxe : Node.js 18 EOL + React 18
(gen_random_uuid(),'20000000-0000-0000-0000-000000000001','Node.js','18.20.3','2025-04-30 00:00:00+00',true),
(gen_random_uuid(),'20000000-0000-0000-0000-000000000001','React','18.3.1',NULL,false),
-- BankCore API : Java 21 LTS + Spring Boot 3.2
(gen_random_uuid(),'20000000-0000-0000-0000-000000000002','Java','21.0.2','2031-09-30 00:00:00+00',false),
(gen_random_uuid(),'20000000-0000-0000-0000-000000000002','Spring Boot','3.2.4',NULL,false),
-- CRM SaaS : PHP 8.0 EOL + Laravel 10
(gen_random_uuid(),'20000000-0000-0000-0000-000000000003','PHP','8.0.30','2023-11-26 00:00:00+00',true),
(gen_random_uuid(),'20000000-0000-0000-0000-000000000003','Laravel','10.48.0',NULL,false),
-- Portail RH : .NET 8
(gen_random_uuid(),'20000000-0000-0000-0000-000000000004','.NET','8.0.3','2026-11-10 00:00:00+00',false);

-- ── Dépendances ───────────────────────────────────────────────────────────────
INSERT INTO "Dependencies" (
    "Id","TechProjectId","Name","CurrentVersion","LatestVersion",
    "Type","Ecosystem","Status","ScannedAt"
) VALUES
-- E-Shop Luxe (npm)
('d1000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 'lodash','4.17.15','4.17.21','Prod','Npm','Vulnerable','2026-03-15 02:00:00+00'),
('d1000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',
 'axios','0.27.2','1.6.8','Prod','Npm','MajorUpdate','2026-03-15 02:00:00+00'),
('d1000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001',
 'express','4.18.2','4.19.2','Prod','Npm','MinorUpdate','2026-03-15 02:00:00+00'),
('d1000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001',
 'jsonwebtoken','8.5.1','9.0.2','Prod','Npm','Vulnerable','2026-03-15 02:00:00+00'),
('d1000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001',
 'react','18.2.0','18.3.1','Prod','Npm','MinorUpdate','2026-03-15 02:00:00+00'),
('d1000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000001',
 'webpack','5.88.0','5.90.3','Dev','Npm','MinorUpdate','2026-03-15 02:00:00+00'),
-- BankCore API (Maven)
('d2000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002',
 'spring-security','6.2.2','6.2.4','Prod','Maven','MinorUpdate','2026-03-18 02:00:00+00'),
('d2000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002',
 'jackson-databind','2.16.1','2.17.0','Prod','Maven','MinorUpdate','2026-03-18 02:00:00+00'),
('d2000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002',
 'log4j-core','2.22.1','2.23.1','Prod','Maven','MinorUpdate','2026-03-18 02:00:00+00'),
('d2000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002',
 'postgresql','42.7.2','42.7.3','Prod','Maven','UpToDate','2026-03-18 02:00:00+00'),
-- CRM SaaS (Composer)
('d3000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003',
 'laravel/framework','10.48.0','11.5.0','Prod','Composer','MajorUpdate','2026-03-19 02:00:00+00'),
('d3000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003',
 'symfony/http-kernel','6.3.8','7.0.6','Prod','Composer','MajorUpdate','2026-03-19 02:00:00+00'),
('d3000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003',
 'guzzlehttp/guzzle','7.8.0','7.8.1','Prod','Composer','Vulnerable','2026-03-19 02:00:00+00'),
('d3000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000003',
 'phpunit/phpunit','10.5.14','11.0.6','Dev','Composer','MajorUpdate','2026-03-19 02:00:00+00'),
('d3000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000003',
 'monolog/monolog','3.5.0','3.6.0','Prod','Composer','MinorUpdate','2026-03-19 02:00:00+00'),
-- Portail RH (NuGet)
('d4000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004',
 'Microsoft.AspNetCore.Authentication.JwtBearer','8.0.3','8.0.3',
 'Prod','NuGet','UpToDate','2026-03-17 02:00:00+00'),
('d4000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000004',
 'Npgsql.EntityFrameworkCore.PostgreSQL','8.0.2','8.0.4',
 'Prod','NuGet','MinorUpdate','2026-03-17 02:00:00+00'),
('d4000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000004',
 'Serilog.AspNetCore','8.0.1','8.0.1',
 'Prod','NuGet','UpToDate','2026-03-17 02:00:00+00');

-- ── Vulnérabilités ────────────────────────────────────────────────────────────
INSERT INTO "Vulnerabilities" (
    "Id","DependencyId","CveId","CvssScore","Description",
    "PackageName","AffectedVersion","FixedVersion","AdvisoryUrl","Severity","DetectedAt"
) VALUES
-- lodash — prototype pollution (Critical)
(
    gen_random_uuid(),
    'd1000000-0000-0000-0000-000000000001',
    'CVE-2020-8203', 9.8,
    'Prototype pollution in lodash before 4.17.20 via merge, mergeWith, defaultsDeep and zipObjectDeep.',
    'lodash','4.17.15','4.17.21',
    'https://nvd.nist.gov/vuln/detail/CVE-2020-8203','Critical','2026-03-15 02:00:00+00'
),
-- jsonwebtoken — algorithm confusion (Critical)
(
    gen_random_uuid(),
    'd1000000-0000-0000-0000-000000000004',
    'CVE-2022-23529', 9.6,
    'jsonwebtoken is vulnerable to algorithm confusion when using a public key as HMAC secret.',
    'jsonwebtoken','8.5.1','9.0.0',
    'https://nvd.nist.gov/vuln/detail/CVE-2022-23529','Critical','2026-03-15 02:00:00+00'
),
-- guzzlehttp — header forwarding on redirect (High)
(
    gen_random_uuid(),
    'd3000000-0000-0000-0000-000000000003',
    'CVE-2023-29197', 7.5,
    'Guzzle forwards sensitive Cookie headers on 3xx redirects, enabling SSRF or session hijacking.',
    'guzzlehttp/guzzle','7.8.0','7.8.1',
    'https://nvd.nist.gov/vuln/detail/CVE-2023-29197','High','2026-03-19 02:00:00+00'
);

-- ── Tickets ───────────────────────────────────────────────────────────────────
INSERT INTO "Tickets" (
    "Id","OrganizationId","ProjectId","Title","Description",
    "Priority","Type","Status","AssignedToId","EstimatedHours",
    "CreatedById","CreatedAt","UpdatedAt","SlaDeadline","SlaBreached","Tags"
) VALUES

-- E-Shop Luxe ─────────────────────────────────────────────────────────────────
(
    '30000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Faille XSS dans le module de commentaires produit',
    'Une injection XSS stockée a été découverte dans le champ "avis client". Un script malveillant peut être exécuté à la lecture du commentaire par un administrateur.',
    'Critical','Security','InProgress',
    '10000000-0000-0000-0000-000000000004', 8,
    '10000000-0000-0000-0000-000000000002',
    '2026-03-14 10:00:00+00','2026-03-15 09:30:00+00',
    '2026-03-16 10:00:00+00', true,
    '["security","xss","frontend"]'
),
(
    '30000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Erreur 500 lors du paiement avec carte AMEX',
    'Les paiements par carte American Express échouent avec une erreur 500. Le prestataire retourne un code non géré par le backend.',
    'High','Bug','New',
    '10000000-0000-0000-0000-000000000005', 4,
    '10000000-0000-0000-0000-000000000002',
    '2026-03-17 14:00:00+00','2026-03-17 14:00:00+00',
    '2026-03-20 14:00:00+00', false,
    '["payment","amex","500"]'
),
(
    '30000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Page de recherche — résultats tronqués au-delà de 100 articles',
    'La pagination côté serveur s''arrête à 100 résultats. Les requêtes SQL ignorent le paramètre de page après la première.',
    'Medium','Bug','InProgress',
    '10000000-0000-0000-0000-000000000004', 6,
    '10000000-0000-0000-0000-000000000003',
    '2026-03-10 09:00:00+00','2026-03-18 11:00:00+00',
    '2026-03-24 09:00:00+00', false,
    '["search","pagination"]'
),
(
    '30000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Ajout du filtre par marque sur la page catalogue',
    'Ajouter un filtre multi-sélection par marque sur /catalogue. Le filtre met à jour l''URL et reste compatible SEO.',
    'Low','Feature','Testing',
    '10000000-0000-0000-0000-000000000006', 12,
    '10000000-0000-0000-0000-000000000003',
    '2026-03-05 09:00:00+00','2026-03-19 15:00:00+00',
    '2026-03-28 09:00:00+00', false,
    '["catalogue","filter","feature"]'
),
(
    '30000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Lenteur critique sur la page d''accueil (TTFB > 4 s)',
    'Le TTFB dépasse 4 secondes en heure de pointe. Cause identifiée : requêtes N+1 sur les produits en vedette.',
    'High','Performance','Resolved',
    '10000000-0000-0000-0000-000000000004', 10,
    '10000000-0000-0000-0000-000000000002',
    '2026-02-28 10:00:00+00','2026-03-08 17:30:00+00',
    '2026-03-03 10:00:00+00', false,
    '["performance","homepage","n+1"]'
),
(
    '30000000-0000-0000-0000-000000000018',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Balises Open Graph manquantes sur les fiches produit',
    'Les balises og:image et og:description sont absentes sur les pages produit. Impact sur le partage réseaux sociaux.',
    'Low','Bug','Closed',
    '10000000-0000-0000-0000-000000000006', 3,
    '10000000-0000-0000-0000-000000000003',
    '2026-02-15 10:00:00+00','2026-03-01 14:00:00+00',
    '2026-03-05 10:00:00+00', false,
    '["seo","opengraph","frontend"]'
),

-- BankCore API ─────────────────────────────────────────────────────────────────
(
    '30000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Injection SQL sur l''endpoint /api/v2/transactions/search',
    'Paramètre ?q= non sanitisé permettant une injection SQL. Confirmé en staging avec sqlmap.',
    'Critical','Security','InProgress',
    '10000000-0000-0000-0000-000000000005', 4,
    '10000000-0000-0000-0000-000000000002',
    '2026-03-18 08:00:00+00','2026-03-18 14:00:00+00',
    '2026-03-19 08:00:00+00', true,
    '["security","sqli","api"]'
),
(
    '30000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Tokens JWT expirés acceptés sur les routes secondaires',
    'Le middleware de validation ne vérifie pas l''expiration sur les endpoints /reports/* et /export/*.',
    'High','Security','New',
    '10000000-0000-0000-0000-000000000005', 3,
    '10000000-0000-0000-0000-000000000002',
    '2026-03-19 10:00:00+00','2026-03-19 10:00:00+00',
    '2026-03-21 10:00:00+00', false,
    '["security","jwt","auth"]'
),
(
    '30000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Export CSV — transactions de décembre 2025 manquantes',
    'L''export CSV du rapport décembre ne contient pas les transactions du 25 au 31. Décalage UTC non géré.',
    'Medium','Bug','Testing',
    '10000000-0000-0000-0000-000000000006', 5,
    '10000000-0000-0000-0000-000000000003',
    '2026-03-11 09:00:00+00','2026-03-17 14:00:00+00',
    '2026-03-25 09:00:00+00', false,
    '["reporting","csv","timezone"]'
),
(
    '30000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Mise à jour documentation Swagger (champs IBAN + statut virement)',
    'L''API OpenAPI doit refléter les nouveaux champs IBAN masqué et statut de virement ajoutés en janvier.',
    'Low','Maintenance','Closed',
    '10000000-0000-0000-0000-000000000006', 4,
    '10000000-0000-0000-0000-000000000003',
    '2026-02-20 09:00:00+00','2026-03-05 11:00:00+00',
    '2026-03-06 09:00:00+00', false,
    '["docs","swagger","maintenance"]'
),
(
    '30000000-0000-0000-0000-000000000019',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Optimisation des index PostgreSQL — table transactions (18 M lignes)',
    'Requêtes >2 s sur la table transactions. Ajout de 3 index composites identifiés par EXPLAIN ANALYZE.',
    'High','Performance','Resolved',
    '10000000-0000-0000-0000-000000000004', 8,
    '10000000-0000-0000-0000-000000000002',
    '2026-03-03 09:00:00+00','2026-03-12 17:00:00+00',
    '2026-03-07 09:00:00+00', false,
    '["performance","postgres","index"]'
),

-- CRM SaaS ────────────────────────────────────────────────────────────────────
(
    '30000000-0000-0000-0000-000000000010',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'Fuite de données inter-tenant sur la recherche de contacts',
    'Le filtre multi-tenant est absent du ContactSearchController — les contacts du tenant A sont visibles par le tenant B.',
    'Critical','Security','InProgress',
    '10000000-0000-0000-0000-000000000004', 6,
    '10000000-0000-0000-0000-000000000002',
    '2026-03-16 11:00:00+00','2026-03-17 09:00:00+00',
    '2026-03-18 11:00:00+00', true,
    '["security","multitenant","gdpr"]'
),
(
    '30000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'Import CSV bloqué au-delà de 500 contacts',
    'L''import échoue silencieusement au-delà de 500 lignes. Pas de feedback utilisateur.',
    'High','Bug','New',
    NULL, 5,
    '10000000-0000-0000-0000-000000000003',
    '2026-03-19 13:00:00+00','2026-03-19 13:00:00+00',
    '2026-03-22 13:00:00+00', false,
    '["import","csv","contacts"]'
),
(
    '30000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'Pipeline e-mail — 45 min pour 10 000 destinataires',
    'Optimisation des workers Laravel Horizon pour réduire le temps de traitement du pipeline marketing.',
    'Medium','Performance','InProgress',
    '10000000-0000-0000-0000-000000000006', 8,
    '10000000-0000-0000-0000-000000000003',
    '2026-03-12 10:00:00+00','2026-03-18 16:00:00+00',
    '2026-03-26 10:00:00+00', false,
    '["performance","horizon","email"]'
),
(
    '30000000-0000-0000-0000-000000000013',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'Widget "Deals en cours" toujours à zéro depuis la v2.4',
    'Champ renommé pipeline_stage → deal_stage non répercuté dans le contrôleur de tableau de bord.',
    'Medium','Bug','Resolved',
    '10000000-0000-0000-0000-000000000006', 2,
    '10000000-0000-0000-0000-000000000003',
    '2026-03-08 14:00:00+00','2026-03-14 10:30:00+00',
    '2026-03-15 14:00:00+00', false,
    '["dashboard","widget","deals"]'
),
(
    '30000000-0000-0000-0000-000000000020',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'Intégration webhook Stripe — abonnements pro',
    'Développer la réception des événements subscription.updated et invoice.payment_failed.',
    'Medium','Feature','New',
    NULL, 15,
    '10000000-0000-0000-0000-000000000003',
    '2026-03-20 08:30:00+00','2026-03-20 08:30:00+00',
    '2026-04-10 08:30:00+00', false,
    '["stripe","webhook","subscription"]'
),

-- Portail RH ──────────────────────────────────────────────────────────────────
(
    '30000000-0000-0000-0000-000000000014',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000004',
    'Module congés — jours fériés 2026 non pris en compte',
    'Les demandes chevauchant un jour férié 2026 décomptent des jours ouvrés incorrects. Table non mise à jour.',
    'High','Bug','InProgress',
    '10000000-0000-0000-0000-000000000005', 6,
    '10000000-0000-0000-0000-000000000002',
    '2026-03-13 10:00:00+00','2026-03-16 09:00:00+00',
    '2026-03-21 10:00:00+00', false,
    '["conges","jours-feries","rh"]'
),
(
    '30000000-0000-0000-0000-000000000015',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000004',
    'Export SILAE — intégration paie automatisée',
    'Développer l''export SILAE (CSV v3.1) pour automatiser la transmission des éléments variables de paie.',
    'Medium','Feature','New',
    NULL, 20,
    '10000000-0000-0000-0000-000000000003',
    '2026-03-20 09:00:00+00','2026-03-20 09:00:00+00',
    '2026-04-15 09:00:00+00', false,
    '["paie","silae","export","rh"]'
),
(
    '30000000-0000-0000-0000-000000000016',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000004',
    'Mise à jour .NET 8.0.3 → 8.0.5 (patch sécurité)',
    'Aucun breaking change identifié. Tests de régression à valider.',
    'Low','Maintenance','Testing',
    '10000000-0000-0000-0000-000000000006', 3,
    '10000000-0000-0000-0000-000000000002',
    '2026-03-06 10:00:00+00','2026-03-19 11:00:00+00',
    '2026-03-27 10:00:00+00', false,
    '["maintenance","dotnet","update"]'
),

-- Transversal ─────────────────────────────────────────────────────────────────
(
    '30000000-0000-0000-0000-000000000017',
    'a0000000-0000-0000-0000-000000000001',
    NULL,
    'Mise en place d''un environnement de staging mutualisé',
    'Besoin d''un staging commun aux 4 projets. Devis et procédure CI/CD à définir.',
    'Medium','Question','New',
    NULL, NULL,
    '10000000-0000-0000-0000-000000000003',
    '2026-03-18 16:00:00+00','2026-03-18 16:00:00+00',
    NULL, false,
    '["infra","staging","devops"]'
);

-- ── Commentaires ──────────────────────────────────────────────────────────────
INSERT INTO "TicketComments" ("Id","TicketId","AuthorId","Content","CreatedAt","UpdatedAt") VALUES
(
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Confirmé en prod. Vecteur : champ "recommander ce produit". Patch sous 24 h max.',
    '2026-03-14 11:30:00+00','2026-03-14 11:30:00+00'
),
(
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'Problème identifié dans ReviewCard.tsx — le contenu n''est pas escapé avant le rendu. Fix avec DOMPurify en cours.',
    '2026-03-15 09:15:00+00','2026-03-15 09:15:00+00'
),
(
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000002',
    'URGENT — signalé par l''équipe sécurité du client. Revue complète des endpoints de recherche demandée.',
    '2026-03-18 08:30:00+00','2026-03-18 08:30:00+00'
),
(
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000005',
    'Le paramètre ?q= est concaténé directement dans la requête JPQL. Correction via PreparedStatement — PR ouverte.',
    '2026-03-18 15:30:00+00','2026-03-18 15:30:00+00'
),
(
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000002',
    'RGPD en jeu. Notification CNIL évaluée avec le DPO. Correctif à déployer avant 20 h ce soir.',
    '2026-03-16 11:45:00+00','2026-03-16 11:45:00+00'
),
(
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000004',
    'Scope Eloquent forTenant() absent sur ContactSearchController. Patch minimal prêt pour déploiement.',
    '2026-03-17 08:45:00+00','2026-03-17 08:45:00+00'
),
(
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000014',
    '10000000-0000-0000-0000-000000000005',
    'Table des jours fériés non mise à jour pour 2026. Je la complète et ajoute un seed dans le DbContext.',
    '2026-03-16 10:30:00+00','2026-03-16 10:30:00+00'
),
(
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000004',
    'N+1 résolus via eager loading (Include). TTFB redescendu à 320 ms. Métriques prod confirmées.',
    '2026-03-08 17:00:00+00','2026-03-08 17:00:00+00'
),
(
    gen_random_uuid(),
    '30000000-0000-0000-0000-000000000019',
    '10000000-0000-0000-0000-000000000004',
    '3 index composites créés : (user_id, created_at), (status, created_at), (account_id, amount). Temps de requête < 40 ms.',
    '2026-03-12 16:30:00+00','2026-03-12 16:30:00+00'
);

-- ── Historique des tickets ────────────────────────────────────────────────────
INSERT INTO "TicketHistories" ("Id","TicketId","UserId","Field","OldValue","NewValue","CreatedAt") VALUES
(gen_random_uuid(),'30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Status','New','InProgress','2026-03-14 11:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','AssignedToId',NULL,'Thomas Dupont','2026-03-14 11:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','Status','New','InProgress','2026-03-18 11:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','AssignedToId',NULL,'Thomas Dupont','2026-03-18 11:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000006','Status','New','InProgress','2026-03-10 09:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000003','Status','InProgress','Testing','2026-03-19 15:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000002','Status','New','InProgress','2026-02-28 11:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000004','Status','InProgress','Resolved','2026-03-08 17:30:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000002','Status','New','InProgress','2026-03-18 14:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000002','AssignedToId',NULL,'Camille Bernard','2026-03-18 14:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000003','Status','New','InProgress','2026-03-14 09:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000006','Status','InProgress','Testing','2026-03-17 14:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000006','Status','New','InProgress','2026-02-22 09:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000006','Status','InProgress','Resolved','2026-03-04 16:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000003','Status','Resolved','Closed','2026-03-05 11:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000002','Status','New','InProgress','2026-03-17 09:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000002','AssignedToId',NULL,'Thomas Dupont','2026-03-17 09:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000006','Status','New','InProgress','2026-03-14 10:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000013','10000000-0000-0000-0000-000000000006','Status','New','InProgress','2026-03-10 14:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000013','10000000-0000-0000-0000-000000000006','Status','InProgress','Resolved','2026-03-14 10:30:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000014','10000000-0000-0000-0000-000000000002','Status','New','InProgress','2026-03-16 09:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000016','10000000-0000-0000-0000-000000000006','Status','New','InProgress','2026-03-08 09:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000016','10000000-0000-0000-0000-000000000006','Status','InProgress','Testing','2026-03-19 11:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000018','10000000-0000-0000-0000-000000000006','Status','New','InProgress','2026-02-16 09:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000018','10000000-0000-0000-0000-000000000006','Status','InProgress','Resolved','2026-02-28 17:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000018','10000000-0000-0000-0000-000000000003','Status','Resolved','Closed','2026-03-01 14:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000019','10000000-0000-0000-0000-000000000002','Status','New','InProgress','2026-03-04 09:00:00+00'),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000019','10000000-0000-0000-0000-000000000004','Status','InProgress','Resolved','2026-03-12 17:00:00+00');

-- ── Saisies de temps (mars 2026) ──────────────────────────────────────────────
INSERT INTO "TimeEntries" (
    "Id","TicketId","TechProjectId","UserId","Date","DurationMinutes","Comment","IsManual"
) VALUES
-- Thomas Dupont ────────────────────────────────────────────────────────────────
(gen_random_uuid(),'30000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','2026-03-04',480,'Résolution N+1 — eager loading + deploy',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000019','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004','2026-03-10',360,'EXPLAIN ANALYZE + création des 3 index',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000019','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004','2026-03-11',120,'Tests de charge + validation métriques',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','2026-03-17',180,'Debug pagination côté serveur',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','2026-03-18',210,'Fix requête SQL + tests unitaires',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','2026-03-14',240,'Analyse vecteur XSS + reproduction',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','2026-03-15',300,'Intégration DOMPurify + tests regression',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004','2026-03-17',240,'Fix scope Eloquent + déploiement patch prod',true),

-- Camille Bernard ──────────────────────────────────────────────────────────────
(gen_random_uuid(),'30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000005','2026-03-18',300,'Fix injection SQL — PreparedStatement + PR',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000005','2026-03-19',120,'Tests de sécurité — validation sqlmap',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005','2026-03-17',120,'Reproduction bug paiement AMEX',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000014','20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000005','2026-03-16',240,'Mise à jour table jours fériés 2026',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000014','20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000005','2026-03-18',180,'Tests module congés + déploiement staging',true),

-- Antoine Lefebvre ─────────────────────────────────────────────────────────────
(gen_random_uuid(),'30000000-0000-0000-0000-000000000018','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','2026-02-16',180,'Ajout balises Open Graph — fiches produit',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','2026-03-10',480,'Développement composant filtre multi-sélection',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','2026-03-11',360,'Compatibilité SEO + mise à jour URL canonique',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000006','2026-03-12',240,'Tests d''intégration filtre',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000006','2026-03-14',300,'Investigation bug export CSV décembre',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000006','2026-03-17',180,'Fix timezone UTC + recette client',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000006','2026-03-12',420,'Profiling Horizon + optimisation workers',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000013','20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000006','2026-03-14',120,'Fix champ deal_stage',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000016','20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000006','2026-03-08',180,'Update .NET 8.0.5 + tests de régression',true),
(gen_random_uuid(),'30000000-0000-0000-0000-000000000016','20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000006','2026-03-19',120,'Recette finale + validation QA',true);

-- ── Factures ──────────────────────────────────────────────────────────────────
INSERT INTO "Invoices" (
    "Id","OrganizationId","TechProjectId","Label","Period",
    "TotalHours","DailyRate","TotalAmount","TaxRate",
    "InvoiceNumber","Status","IssuedAt","DueAt","PaidAt"
) VALUES
-- Janvier 2026 — Payées ────────────────────────────────────────────────────────
(
    '40000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'TMA E-Shop Luxe — Janvier 2026','2026-01',
    92.50, 650.00, 60125.00, 20.00,
    1,'Paid','2026-02-03 09:00:00+00','2026-02-28 09:00:00+00','2026-02-20 14:00:00+00'
),
(
    '40000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'TMA BankCore API — Janvier 2026','2026-01',
    108.00, 750.00, 81000.00, 20.00,
    2,'Paid','2026-02-03 09:00:00+00','2026-02-28 09:00:00+00','2026-02-25 11:00:00+00'
),
(
    '40000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'TMA CRM SaaS — Janvier 2026','2026-01',
    76.00, 600.00, 45600.00, 20.00,
    3,'Paid','2026-02-03 09:00:00+00','2026-02-28 09:00:00+00','2026-03-02 09:30:00+00'
),
-- Février 2026 — En retard (Sent, échéance dépassée) ──────────────────────────
(
    '40000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'TMA E-Shop Luxe — Février 2026','2026-02',
    87.00, 650.00, 56550.00, 20.00,
    4,'Sent','2026-03-03 09:00:00+00','2026-03-14 09:00:00+00', NULL
),
(
    '40000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'TMA CRM SaaS — Février 2026','2026-02',
    94.50, 600.00, 56700.00, 20.00,
    5,'Sent','2026-03-03 09:00:00+00','2026-03-15 09:00:00+00', NULL
),
-- Mars 2026 — Brouillons ───────────────────────────────────────────────────────
(
    '40000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'TMA BankCore API — Février 2026','2026-02',
    115.00, 750.00, 86250.00, 20.00,
    6,'Draft','2026-03-20 09:00:00+00', NULL, NULL
),
(
    '40000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000004',
    'TMA Portail RH — Février 2026','2026-02',
    62.00, 700.00, 43400.00, 20.00,
    7,'Draft','2026-03-20 09:00:00+00', NULL, NULL
);

COMMIT;
