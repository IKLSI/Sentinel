# CLAUDE.md — Sentinel

## Projet

SaaS multi-tenant de tech health : branche des dépôts GitHub/GitLab, parse leurs manifestes de dépendances, croise avec OSV (vulnérabilités), les registries publics (versions) et endoflife.date (runtimes EOL), calcule un score de santé par projet. Autour : tickets, conformité, SBOM, audit. SaaS ouvert : inscription publique, landing, scan public anonyme. Aucune facturation, aucun plan ni quota.

`Organization` → `Project` → `Dependency`/`Runtime`/`Vulnerability`, plus `Ticket`. Rôles : `Admin`, `Developer`. Features `Application/` nommées comme l'UI : `Projects/` (CRUD, détail, import, badge, export Excel), `Scanning/` (scan, parseurs, déclenchement, progression), `Suppressions/`, `Remediation/`, `Compliance/`, `Sbom/`, `PublicScan/`, `ScoringModel/`, `RuntimeLifecycles/` ; règles de score dans `Domain/TechHealth/`.

## Stack

- Backend : .NET 10, Clean Architecture, EF Core 10 + Npgsql, Hangfire, Serilog, JWT, SignalR, QuestPDF/ClosedXML, Scalar
- Frontend : React 19, TypeScript 7, Vite 8, TanStack Router/Query, MUI v9, react-hook-form + zod, axios, Biome, Vitest
- PostgreSQL (isolation par Row Level Security), base de dev distante (Supabase). Docker non requis en local, sauf pour les tests d'intégration (Testcontainers)
- Déploiement : API conteneurisée via `server/Dockerfile` (multi-stage, utilisateur non-root, `HEALTHCHECK` sur `/health`, port lu dans `PORT`) ; front sur Vercel (`client/vercel.json` : rewrites SPA + CSP et en-têtes de sécurité). Mono-instance. `README.md` = doc humaine (installation, variables d'environnement, déploiement) : la tenir à jour quand la config change

## Commandes et vérifications

```bash
pnpm dev                                          # API + front (racine)

dotnet build Sentinel.slnx -c Release                                     # gate
dotnet run --project server/tests/Sentinel.Tests/Sentinel.Tests.csproj   # gate
pnpm --prefix client check && pnpm --prefix client lint:dead          # gate — Biome, knip
pnpm --prefix client build && pnpm --prefix client test               # gate

pnpm --prefix client generate:api               # OpenAPI → types + routes ; backend démarré requis (localhost:5000)
pnpm --prefix client generate:realtime          # contrat SignalR depuis le C# ; aucun backend requis

dotnet ef migrations add <Nom> --project server/src/Infrastructure --startup-project server/src/API
```

- **Avant de rendre une tâche** : faire passer les `gate` concernés par la modification
- Si `Domain/Constants/Realtime{Constants,Resources}.cs` a bougé : regénérer le contrat et committer `contract.gen.ts`, sinon la CI échoue
- La CI (`.github/workflows/ci.yml`) rejoue cette même chaîne et ajoute : `pnpm audit --audit-level high`, audit NuGet (`--vulnerable --include-transitive`), gitleaks sur tout l'historique, dependency-review sur PR. Aucun seuil de couverture — artifacts seulement
- Migrations appliquées au démarrage, `DataSeeder` en Development. Ne jamais rééditer une migration déjà appliquée : en ajouter une nouvelle
- **Config de démarrage** : pas de `UserSecretsId`, tout passe par variables d'environnement. Obligatoires même en Development : `ConnectionStrings__DefaultConnection`, `Jwt__Secret` (≥ 32 octets), `DataProtection__CertBase64` (PFX base64 protégeant le key ring). Hors Development en plus : `Frontend__BaseUrl`, `ForwardedHeaders__KnownProxies`/`KnownNetworks`. Optionnels : `ConnectionStrings__Migrations` (propriétaire du schéma distinct du rôle applicatif), `RepositoryHosts__GitHubToken`, `Remediation__{GitHubToken,WorkflowRepository,WorkflowFile,WorkflowRef,CallbackBaseUrl}` (correction automatique via Renovate dans un run GitHub Actions, cf. README)
- Workflow `backup-database.yml` : dump nocturne chiffré, restauration vérifiée (policies RLS, clés Data Protection), conservé 7 jours en artifact GitHub
- `scripts/release.mjs` (`pnpm release`) : bump de `client/package.json`, tag et push sur la branche courante

## Backend

`Domain` ← `Application` ← `Infrastructure`/`API`. Composition DI éclatée dans `API/Extensions/ServiceCollectionExtensions.*.cs` — y ajouter les enregistrements, pas dans `Program.cs`. `AddApplicationServices()` n'enregistre que des types `Application`, `AddInfrastructureServices()` que des implémentations `Infrastructure` : ne pas les mélanger.

**Aucun SDK d'accès externe dans `Application`** : réseau, base, SMTP, paiement passent par un port `Domain/Abstractions` implémenté dans `Infrastructure`. Les librairies de rendu de documents (`ClosedXML`, `QuestPDF`, `CycloneDX`) sont l'exception assumée : elles restent dans `Application/Exports/`, `Application/Compliance/` et `Application/Sbom/`, au plus près de la logique d'export — in-process, déterministes, sans dépendance externe, les abstraire coûtait plus cher que ça ne rapportait.

- **Use-case vertical-slice** : `Application/{Feature}/{UseCase}/{Nom}Service.cs` (`IService`, méthode `ExecuteAsync`, retourne `Result`/`Result<T>`) + `{Nom}Validator.cs` (`IValidator`). Ex : `Application/Auth/Login/`
- **DTOs d'API dans la slice qui les consomme** (`Application/Auth/Login/LoginRequest.cs`), remontés au niveau `Application/{Feature}/` s'ils servent plusieurs slices, `Application/Common/Contracts/` s'ils sont transverses. **Aucun DTO dans `Domain`** : les repositories retournent des projections `Domain/Repositories/*Rows.cs`, le mapping vers le DTO se fait dans le service
- **Settings placés dans la couche qui les consomme** : `Application/Options/` (Jwt, Frontend, Support), `API/Options/` (Cookie, Cors, Database, DataProtection, ForwardedHeaders), `Infrastructure/Email/EmailSettings.cs`
- **Validation maison**, ni FluentValidation ni DataAnnotations : `Application/Common/ValidationErrors.cs` (fluent `.Required`, `.EmailAddress`, `.MaxLength`), codes dans `ValidationCodes`
- **Contrôleurs sans logique** : service injecté **par action** via `[FromServices]`, jamais par le constructeur ; retour via `BaseController.ToActionResult(result)` / `ToFileResult(result)`
- **Erreurs** : `API/Middleware/ErrorHandlingMiddleware.cs`, exception → `(HttpStatusCode, ErrorCodes)`, écrit `ApiErrorResponse` (`API/Contracts/` — porte un statut HTTP, donc côté présentation) — pas `ProblemDetails`. Traduction via `API/Resources/Locales/{en-US,fr-FR}.json` (`JsonLocalizer`)
- **Persistance** : repositories par agrégat, écritures via `ICommitScopeFactory`. `ExecuteInTransactionAsync` purge le ChangeTracker — le délégué doit recharger ses entités
- **Auth** : access token JWT (`Application/Security/TokenService.cs`) ; refresh token = 64 octets + hash SHA256, transporté par cookie HttpOnly (`IRefreshTokenStore` → `API/Services/RefreshTokenCookie.cs`) ; révocation par `User.TokenVersion` (incrémenté au logout, vérifié à chaque requête dans `ValidateAccountStateAsync`, état de compte caché 30 s) ; PAT de dépôt chiffrés par `TokenProtector` (Data Protection) ; accès machine par `API/Middleware/ApiKeyMiddleware.cs`. Côté front, l'access token vit **en mémoire uniquement** (`configs/session.ts`) ; `localStorage` ne garde qu'un indicateur `session-active` qui déclenche un `/auth/refresh` silencieux au chargement (sa réponse porte le profil : pas de `/auth/me` en plus). Les traductions y sont aussi mises en cache (`sentinel_translations:<langue>`) puis revalidées en arrière-plan
- **Jobs** : planification via `IJobScheduler`, lecture via `IRecurringJobMonitor` (`Domain/Abstractions`), adaptateurs Hangfire dans `Infrastructure/Jobs/`. `Application` ne référence `Hangfire.Core` que pour `[AutomaticRetry]` — choix assumé, une abstraction maison pour ce seul attribut coûtait plus cher qu'elle ne rapportait. Corps des jobs dans `Application/Jobs/` ; les récurrents se déclarent dans `API/Extensions/WebApplicationExtensions.cs` avec un identifiant de `RecurringJobIds`. Hangfire persiste le nom qualifié des types cibles et arguments de job : ne jamais en renommer ni changer le namespace (d'où `ProjectScanService`, cible des scans, resté seul dans `Application/TechHealth/Scan/`)
- **Appels sortants** : toujours derrière une abstraction `Domain/Abstractions` implémentée dans `Infrastructure/Http/` — `IDependencyRegistryClient` (registries), `IVulnerabilityFeedClient` (OSV), `IRuntimeLifecycleClient` (endoflife.date), `IRepositoryHostClient` (façade `RepositoryHostClient` ; `Http/RepositoryHosting/` : `GitHubRepositoryHost`, `GitLabRepositoryHost`, helpers partagés dans `RepositoryHostHttp` — pagination, téléchargement borné à 5 Mo), `IRemediationRunner` (runs GitHub Actions). Aucun `HttpClient` dans `Application`
- **Token GitHub serveur** (`RepositoryHosts:GitHubToken`) : sert uniquement à lever le quota sur les dépôts **publics**. Sans token d'organisation, `GitHubRepositoryHost.ResolveTokenAsync` vérifie d'abord `private == false` (cache 10 min) avant de l'envoyer ; sinon la requête part anonyme. Ne jamais réintroduire de repli inconditionnel
- **Règles de score = backend** : poids et seuils dans `Domain/TechHealth/HealthScoreCalculator` (`GradeThresholds`, `Penalties`), exposés publiquement par `GET /api/public/scoring-model` (consommé par la landing). Statut EOL d'un runtime (`Unknown`/`Ok`/`Warn`/`Danger`/`Eol`, jours restants, progression) calculé par `RuntimeEolAssessment` et livré dans `RuntimeDto`. Le front ne recopie aucun seuil
- **Versions** : `Domain/Versioning/VersionComparer` compare par tokens numériques/qualificatifs (PEP 440 avec epoch, Maven, RubyGems, semver). Une dépendance non épinglée est interrogée sur OSV avec sa borne basse déclarée. En 0.x, un saut de mineure (ou de patch en 0.0.x) compte comme majeur
- **Parseurs** : `Application/Scanning/Parsers/`, une classe par écosystème derrière `IManifestFileParser` (`CanParse`/`Parse`, aiguillage par nom de fichier) qui gère tous ses formats (`NodeManifestParser` + `NodeLockGraphParser` pour yarn/bun, `PythonManifestParser`, `JvmManifestParser`…), fichiers de runtime dans `RuntimeFilesParser`/`DockerfileParser`, helpers dans `ManifestEntries`/`TomlManifest`, classification des fichiers dans `ManifestFileKinds` ; `ManifestParserService` reste la façade appelée par le scan (liste des parseurs ; un nouveau format s'ajoute à la classe de son écosystème)
- **Inventaire** (`Scanning/RepositoryScannerService`) : une seule clé d'identité `(écosystème, nom normalisé PyPI, minuscules)` pour typage, directness, verrouillage et dédoublonnage. Un lockfile sans manifeste de son écosystème marque ses entrées transitives, sauf les formats qui portent la directness (`ManifestParserService.ReportsDirectness` : package-lock v2+, packages.lock.json, Gemfile.lock, pubspec.lock, Podfile.lock, Package.resolved). Alias npm résolus vers le vrai paquet, `devOptional` = dev
- **Compteurs d'inventaire** : `Project.InventoryCounts` (type possédé, colonnes `InventoryCounts_*`) recalculé par `ProjectInventoryCounts.Of` en fin de scan et sur échec de scan ; la liste des projets et le dashboard les lisent au lieu d'agréger dépendances et failles. Détail projet côté SPA : `projects/{id}/overview` (en-tête + dépendances vulnérables) et `projects/{id}/dependencies/without-vulnerabilities` (chargé à l'ouverture de l'onglet, fusionné côté front avec les vulnérables de l'overview) ; `projects/{id}` reste complet pour l'accès par clé API
- **Exports** : via `Application/Exports/ExportService*.cs`, bornés par `ExportLimits` et la politique `RateLimitPolicies.Export`
- **GitLab** : instance paramétrée par organisation dans l'UI (Paramètres → Intégrations) : `Organization.GitlabBaseUrl` (null = gitlab.com). Elle voyage avec le token dans `RepositoryAccess` (`Domain/Git`) et sert de base aux requêtes du client HTTP nommé `GitLab`. Pas de CA personnalisée : l'instance doit présenter un certificat reconnu par le magasin système. Hôtes acceptés à la création de projet : `RepositoryHosts.IsSupported` (GitHub + hôte GitLab de l'organisation). Changer d'instance est refusé (`errors.settings.gitlab_instance_in_use`) tant que des projets pointent vers l'ancien hôte

### Multi-tenant : deux barrières

1. `ITenantContext` (OrganizationId/UserId/Jti) + filtres EF globaux dans `SentinelContext`
2. **RLS PostgreSQL** : `Infrastructure/Data/TenantCommandInterceptor.cs` pose `set_config('app.current_org', …)` avant chaque commande — préfixé dans la même commande pour les requêtes LINQ/`FromSql` (`CommandSource`, premier jeu de résultats sauté), aller-retour séparé pour les écritures (Npgsql lit les lignes affectées par index d'instruction) ; `ISystemScope.Enter()` bascule sur `system` hors requête (migrations, jobs, seed)
   - `DatabaseConnectionScopeMiddleware` garde la connexion ouverte si `Database:KeepConnectionOpenPerRequest` — sinon le `set_config` ne survit pas d'une commande à l'autre
   - `API/Extensions/DatabaseRoleGuard.cs` refuse le démarrage hors Development si le rôle Postgres est superuser ou `BYPASSRLS` : la RLS serait silencieusement inopérante

### Temps réel (SignalR)

Hub `API/Realtime/SentinelHub.cs` sur `/hubs/sync`, un groupe par organisation. Les services mutants diffusent un `RealtimeEvent` via `IRealtimeNotifier` **après commit** ; le front invalide les query keys mappées (`client/src/domains/realtime/constants.ts`).

- Contrat **généré** depuis `Domain/Constants/Realtime{Constants,Resources}.cs` → `contract.gen.ts`. Le C# est la source de vérité ; ajouter une ressource sans mapper ses query keys casse `tsc` sur le `switch` exhaustif de `resolveInvalidatedKeys`. La CI échoue si désynchronisé
- JWT en query string au handshake (`?access_token=`) : masquer ce paramètre dans les logs du reverse-proxy en prod
- L'émetteur reçoit son propre événement (pas d'exclusion par `ConnectionId`) et c'est ce qui rafraîchit l'auteur : les `onSuccess` n'invalident pas les clés déjà couvertes par le mapping serveur (`setQueryData` seulement, pour l'affichage immédiat). Ne pas exclure l'émetteur ; si le hub est coupé, la resynchronisation à la reconnexion rattrape

### Mono-instance assumée

Un seul process en prod. Rate limiting, `IMemoryCache` (état de compte auth, dashboard, clés API, flux externes) et diffusion SignalR sont in-process. La persistance en base (key ring Data Protection, storage Hangfire) sert la survie au redémarrage, pas le partage entre nœuds — ne pas la retirer, ne pas introduire de backplane.

## Frontend

`domains/*` = couche API/state, **zéro UI** :

- `queries.ts` : `use<Entity>Query` via `useGetQuery` (`domains/helpers.ts`)
- `mutations.ts` : `use<Verb><Entity>Mutation` via `usePostMutation`/`usePatchMutation`/`useDeleteMutation`, invalidation par `invalidateKeys([...])`
- `constants.ts` (query keys ; stale-time global dans `configs/queryClient.ts`, la fraîcheur vient du temps réel), `types.ts`, `fetchers.ts`/`downloads.ts`

`features/*` = UI : `pages/*.tsx`, `components/<ComponentName>/index.tsx` (un dossier PascalCase par composant), `schemas.ts` (zod + `<Name>FormValues` via `z.infer`, consommés par `useForm({ resolver: zodResolver(schema) })` — pas de wrapper form partagé), `routeGuards.ts`.

Transverse : `configs/apiClient.ts` (axios, intercepteur 401 → refresh unique avec file d'attente, uniquement pour une requête qui portait un Bearer), `configs/session.ts` (token en mémoire ; le logout vide le cache React Query et recharge la page), `contexts/` (Auth, I18n, Theme, Sidebar, Toast), `hooks/` (hooks partagés : `useDeleteDialog`, `useGridControls`, `usePagination`…), `components/ui/{common,forms}` à réutiliser avant d'écrire un équivalent local (`common/` rangé par famille : `modal/`, `table/`, `feedback/` — états vide/erreur/chargement, squelettes —, le reste à la racine ; un composant n'y entre qu'avec au moins deux consommateurs), alias `@/` → `src/`, routing fichier TanStack (`routes/_authenticated/` = zone protégée).

**UI = MUI + thème, pas de CSS maison** : le style des composants vit dans `configs/themes/index.ts` (variantes de boutons, champs, focus, lecture seule) ; `styles/global.css` ne garde que les tokens `--*`, les règles globales (scrollbar, sélection, focus) et l'impression. Jamais de `<input>`/`<select>`/`<textarea>`/`<button>` natifs ni de `Box component="button"` : champs via `components/ui/forms/` (`FormTextField`, `FormSelectField`, `PasswordTextField`, `FormField` — `react-hook-form` ou contrôlés), boutons via `Button` (`color="inherit"` = Annuler), `IconButton` (icône seule) ou `ButtonBase` (design spécifique, sans `all: "unset"` qui écrase ses styles). Animations via `keyframes` de `styles/keyframes.ts`. En-tête de carte : `components/ui/common/CardHeader`. Pages d'auth : `features/auth/components/AuthLayout` + `AuthShowcase`. Landing : couleurs via les tokens de `LANDING_THEME` (`features/landing/constants.ts`), transparences en `color-mix`.

**Fichiers générés, jamais édités à la main** : `routeTree.gen.ts`, `configs/api-routes.gen.ts` + types OpenAPI, `domains/realtime/contract.gen.ts`.

## Tests

- Backend `server/tests/Sentinel.Tests` : xunit.v3 + FluentAssertions + Testcontainers + EFCore.InMemory. `Helpers/PostgresFixture.cs` lance `postgres:17-alpine` (ou `SENTINEL_TEST_POSTGRES`), migre, crée le rôle restreint `sentinel_app` pour tester la RLS ; `EnsureAvailable()` skippe en local si Postgres manque, échoue si `CI` est défini
- Frontend `client/src/tests` : Vitest + Testing Library, setup `tests/setup.ts`, helpers `tests/test-utils.tsx`. `vitest.config.ts` limite `include` à `src/tests/**` — un test posé à côté du composant **n'est jamais exécuté**

## Conventions

- **Zéro commentaire** : noms explicites, découpage clair
- Backend = logique métier complète ; frontend = affichage et collecte (validation UX front tolérée)
- **Messages et codes d'erreur d'API en anglais** — override assumé de la règle française du CLAUDE.md global ; traduction utilisateur via les fichiers de locales
- `pnpm` uniquement côté frontend
- Avant tout travail UI : consulter `/style-guide` (dev only, `features/styleGuide/pages/StyleGuidePage`) pour les tokens et patterns réels

## Pièges connus

- `openapi-typescript` est figé en v6 : les versions suivantes exigent une API compilateur absente de TypeScript 7
- Sans Docker ni `SENTINEL_TEST_POSTGRES`, les tests d'intégration sont skippés en local : InMemory ne couvre ni la RLS ni le relationnel
- `dotnet ef` sans `ConnectionStrings__DefaultConnection` retombe sur `localhost` alors que la base de dev est distante
- Démarrer l'API (pour `generate:api` notamment) applique les migrations et lance `DataSeeder` sur la base de dev partagée
- Windows + `core.autocrlf=true` : la copie de travail est en CRLF alors que Biome attend LF, donc `pnpm check` signale tous les fichiers en local. Vérifier avec `pnpm exec biome check --line-ending=crlf src` ; la CI (Linux, LF) n'est pas concernée
