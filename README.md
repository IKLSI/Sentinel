# Sentinel

SaaS de suivi de la santé technique des dépôts GitHub et GitLab. Sentinel lit les manifestes de dépendances, les croise avec OSV (vulnérabilités), les registries publics (versions) et endoflife.date (runtimes en fin de vie), puis calcule un score de santé A→F par projet. Autour : tickets, conformité, SBOM, journal d'audit et scan public anonyme.

## Stack

| Couche | Technologies |
| --- | --- |
| Backend | .NET 10, ASP.NET Core, EF Core 10 + Npgsql, Hangfire, SignalR, Serilog |
| Frontend | React 19, TypeScript 7, Vite 8, TanStack Router/Query, MUI 9 |
| Base | PostgreSQL, isolation multi-tenant par Row Level Security |

## Prérequis

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- Node.js 24 et pnpm 12 (`corepack enable` ou `npm i -g pnpm`)
- Une base PostgreSQL accessible (locale ou distante)
- Docker, uniquement pour lancer les tests d'intégration en local

## Installation

```bash
git clone https://github.com/IKLSI/Sentinel.git
cd Sentinel
pnpm install            # outils racine (concurrently)
pnpm install-deps       # dépendances du front
dotnet restore Sentinel.slnx
```

## Configuration

Le backend se configure par **variables d'environnement** (séparateur `__` pour les sections). `server/src/API/appsettings.json` ne contient que des valeurs vides : ne jamais y écrire de secret.

### Obligatoires (tous environnements)

| Variable | Rôle |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | Chaîne de connexion Npgsql du rôle applicatif |
| `Jwt__Secret` | Clé de signature des JWT, au moins 32 octets |
| `DataProtection__CertBase64` | Certificat PFX encodé en base64, qui chiffre le trousseau de clés Data Protection (tokens d'intégration chiffrés en base) |

### Obligatoires hors Development

| Variable | Rôle |
| --- | --- |
| `Frontend__BaseUrl` | URL publique du front (liens des e-mails, origine CORS autorisée) |
| `ForwardedHeaders__KnownProxies__0` ou `ForwardedHeaders__KnownNetworks__0` | Reverse-proxy de confiance, indispensable au rate limiting par IP |

Au démarrage hors Development, l'API refuse aussi un rôle Postgres superuser ou `BYPASSRLS` : la RLS serait inopérante.

### Optionnelles

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `ConnectionStrings__Migrations` | `DefaultConnection` | Rôle propriétaire du schéma, utilisé pour appliquer les migrations |
| `RepositoryHosts__GitHubToken` | vide | Token GitHub serveur, utilisé uniquement pour lever le quota sur les dépôts **publics** |
| `Remediation__GitHubToken`, `Remediation__WorkflowRepository`, `Remediation__WorkflowFile`, `Remediation__WorkflowRef`, `Remediation__CallbackBaseUrl` | vide / vide / `remediation.yml` / `main` / vide | Correction automatique des vulnérabilités (voir [Correction automatique](#correction-automatique)). Toutes requises pour activer le bouton ; `CallbackBaseUrl` = URL HTTPS publique de l'API |
| `Email__Host`, `Email__Port`, `Email__Username`, `Email__Password`, `Email__FromAddress`, `Email__FromName` | port 587 | SMTP des e-mails transactionnels |
| `Support__Email` | vide | Adresse de support affichée dans l'application |
| `Cors__AllowedOrigins__0` | `Frontend__BaseUrl` | Origines supplémentaires autorisées |
| `Jwt__AccessTokenExpirationMinutes` / `Jwt__RefreshTokenExpirationDays` | 15 / 30 | Durées de vie des jetons |
| `Cookie__Domain`, `Cookie__SameSite` | vide / `Lax` | Cookie du refresh token |
| `Database__MaxPoolSize`, `Database__CommandTimeoutSeconds`, `Database__RetryCount` | 40 / 30 / 3 | Réglages Npgsql |
| `PORT` | 8080 | Port d'écoute dans l'image Docker |

Côté front, `VITE_API_URL` indique l'URL de l'API au build. Vide en développement : le serveur Vite proxifie `/api` et `/hubs` vers `http://localhost:5000`.

### Générer le certificat Data Protection

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 3650 -nodes -subj "/CN=Sentinel DataProtection"
openssl pkcs12 -export -out dataprotection.pfx -inkey key.pem -in cert.pem -passout pass:
base64 -w0 dataprotection.pfx   # valeur de DataProtection__CertBase64
```

Conservez ce certificat : sans lui, les tokens d'intégration déjà chiffrés en base deviennent illisibles.

## Lancer en développement

```bash
pnpm dev
```

Cette commande démarre l'API sur `http://localhost:5000` et le front sur `http://localhost:3000`. Au démarrage, l'API applique les migrations EF et, en Development, alimente la base avec `DataSeeder`. La documentation de l'API (Scalar) est servie sur `/scalar` en Development.

## Vérifications

```bash
dotnet build Sentinel.slnx -c Release
dotnet run --project server/tests/Sentinel.Tests/Sentinel.Tests.csproj
pnpm --prefix client check && pnpm --prefix client lint:dead
pnpm --prefix client build && pnpm --prefix client test
```

Les tests d'intégration démarrent un PostgreSQL via Testcontainers (Docker requis) ou utilisent `SENTINEL_TEST_POSTGRES`. Sans l'un ni l'autre, ils sont ignorés en local et échouent en CI.

Sous Windows avec `core.autocrlf=true`, la copie de travail est en CRLF et `pnpm check` signale tous les fichiers ; utilisez `pnpm --prefix client exec biome check --line-ending=crlf src`.

## Code généré

| Commande | Produit | Prérequis |
| --- | --- | --- |
| `pnpm --prefix client generate:api` | `src/types/api.gen.ts`, `src/configs/api-routes.gen.ts` | API démarrée sur `localhost:5000` |
| `pnpm --prefix client generate:realtime` | `src/domains/realtime/contract.gen.ts` | aucun |

Ces fichiers ne s'éditent jamais à la main ; la CI échoue si le contrat temps réel est désynchronisé.

## Migrations

```bash
dotnet ef migrations add <Nom> --project server/src/Infrastructure --startup-project server/src/API
```

Toute nouvelle table liée à une organisation doit activer et forcer la RLS dans sa migration (voir `AddVulnerabilitySuppressions`). Ne jamais modifier une migration déjà appliquée.

## Déploiement

L'application tourne en **mono-instance** : rate limiting, caches et diffusion SignalR sont en mémoire.

- **API** : image construite depuis `server/Dockerfile` (contexte `server/`), utilisateur non-root, healthcheck sur `/health`, port lu dans `PORT`. Les migrations s'appliquent au démarrage.
  ```bash
  docker build -t sentinel-api server
  docker run -p 8080:8080 --env-file sentinel.env sentinel-api
  ```
- **Front** : déployé sur Vercel depuis `client/` (`pnpm build`, sortie `dist`). `client/vercel.json` gère les rewrites SPA ainsi que la CSP et les en-têtes de sécurité. Définir `VITE_API_URL` sur l'URL publique de l'API.
- **Reverse-proxy** : masquer le paramètre `access_token` des URL `/hubs/sync` dans les logs (jeton SignalR passé en query string).
- **Sauvegardes** : le workflow `backup-database.yml` réalise chaque nuit un dump chiffré, vérifie sa restauration et le conserve 7 jours en artifact GitHub.
- **Versions** : `pnpm release` incrémente la version de `client/package.json`, crée le tag et pousse.

### Correction automatique

Le bouton « Tout corriger » de la fiche projet ouvre une seule merge request (GitLab) ou pull request (GitHub) qui monte chaque dépendance directe vulnérable à sa version corrective (la plus haute si plusieurs vulnérabilités la touchent). Les dépendances transitives, les vulnérabilités sans version corrective et celles couvertes par une exception active sont exclues. Le travail est fait par [Renovate](https://github.com/renovatebot/renovate) (licence AGPL-3.0, utilisé sans modification) dans un run GitHub Actions éphémère (`.github/workflows/remediation.yml`), jamais dans le process de l'API.

1. Le workflow doit être présent sur la branche par défaut du dépôt qui l'héberge (ce dépôt, ou un dépôt **privé** dédié qui en reprend une copie : les paramètres d'un run sont visibles dans l'onglet Actions).
2. Créer un token GitHub fine-grained limité à ce dépôt, permission **Actions : Read and write**.
3. Côté API : `Remediation__GitHubToken` (ce token), `Remediation__WorkflowRepository` (`owner/repo`), `Remediation__WorkflowFile` (`remediation.yml`), `Remediation__WorkflowRef` (`main`), `Remediation__CallbackBaseUrl` (URL publique de l'API, joignable depuis GitHub).
4. Les organisations doivent fournir un token **en écriture** : scope `api` sur GitLab, `Contents` et `Pull requests` en écriture sur GitHub.

Déroulé : l'API enregistre la demande et déclenche le workflow (`workflow_dispatch`, run nommé `Sentinel remediation <id>`). Le run récupère sa configuration Renovate via `GET /api/remediation-runs/{id}/config` avec un ticket à usage unique valable 15 minutes, masqué dans les logs, puis Renovate ouvre la MR sur la branche `sentinel/fix-vulnerabilities`. La liste des paquets est calculée à ce moment-là, depuis le dernier scan. Renovate n'active que les managers des écosystèmes concernés et, quand les manifestes ciblés sont dans des sous-dossiers, ne parcourt que ces dossiers (Maven/Gradle gardent le périmètre du projet à cause des POM parents et catalogues de versions). La MR liste chaque paquet, sa montée de version, les CVE corrigées et signale les montées majeures. Une seule correction à la fois par projet ; la relancer met à jour la même branche. En fin de run, le workflow notifie l'API (`POST /api/remediation-runs/{id}/completion`, second ticket à usage unique, masqué lui aussi) : l'API retrouve aussitôt la MR et met à jour le statut. Si cette notification n'arrive pas, un job Hangfire vérifie l'état du run toutes les 2 minutes et prend le relais. Compter 3 à 5 minutes par run.

Limites : seules les dépendances directes avec une version corrective connue sont éligibles ; une montée de version majeure est signalée dans l'interface ; les registries privés ne sont pas pris en charge ; les minutes GitHub Actions gratuites (2 000/mois sur un dépôt privé) sont partagées par toutes les organisations.

## Licence

MIT, voir [LICENSE](LICENSE).
