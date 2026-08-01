# CLAUDE.md

## Stack
- Backend: .NET 10, ASP.NET Core, EF Core 10 + Npgsql (PostgreSQL), Clean Architecture (Domain/Application/Infrastructure/API), Hangfire, Serilog, JWT, SignalR, Swashbuckle/Scalar (OpenAPI)
- Frontend: React 19 + TypeScript, Vite 8, TanStack Router/Query, MUI v9, react-hook-form + zod, Biome (lint/format), Vitest

## Commandes
- Dev complet (root) : `pnpm dev`
- Backend build : `dotnet build Sentinel.slnx -c Release`
- Backend tests : `dotnet run --project backend/tests/Sentinel.Tests/Sentinel.Tests.csproj`
- Frontend lint : `pnpm --prefix frontend check` (biome) / `pnpm --prefix frontend lint:dead` (knip)
- Frontend tests : `pnpm --prefix frontend test`
- Génération client API (openapi-typescript) : `pnpm --prefix frontend generate:api`

## Architecture

### Backend
- Clean Architecture, feature-folders vertical-slice dans `Application/{Feature}/{UseCase}`
- Multi-tenant via `ITenantContext` (OrganizationId/UserId/Jti) propagé dans les services
- Validation : pattern maison, pas FluentValidation/DataAnnotations. Chaque use-case a un `*Validator` implémentant `IValidator` (`Application/Abstractions/IValidator.cs`), construit `ValidationErrors` (`Application/Common/ValidationErrors.cs`, fluent : `.Required`, `.EmailAddress`, `.MaxLength`...) keyé sur `ValidationCodes`, retourne `Result`. Ex : `Application/Auth/Login/AuthLoginValidator.cs`
- Erreurs : middleware global `API/Middleware/ErrorHandlingMiddleware.cs`, mappe type d'exception → `(HttpStatusCode, code ErrorCodes)`, écrit `ApiErrorResponse` (`Domain/DTOs/Common/ApiErrorResponse.cs` : Code/Status/Timestamp/Params) — pas `ProblemDetails`. Messages localisés via `Infrastructure/Localization/JsonLocalizer.cs` depuis `API/Resources/Locales/{en-US,fr-FR}.json`
- Auth JWT : génération dans `Application/Security/TokenService.cs::GenerateAccessToken` (claims Sub/Email/Role/OrganizationId/UserId/TokenVersion/Jti). Refresh token = 64 bytes random + hash SHA256, stocké via `IRefreshTokenStore`, consommé dans `Application/Auth/Refresh/AuthRefreshService.cs`. Hash mdp : `Infrastructure/Security/BCryptPasswordHasher.cs`. Révocation : `Application/Security/TokenBlacklistService.cs` + `Domain/Models/RevokedToken.cs`
- Migrations EF Core : `Infrastructure/Migrations/`, générées/appliquées via CLI standard `dotnet ef migrations add` / `dotnet ef database update` (pas de script wrapper)
- Billing (Stripe.net) : `Application/Billing/*` (checkout/portal/webhook), idempotence webhooks via `Domain/Models/ProcessedStripeEvent.cs`
- Exports (QuestPDF/ClosedXML) : `Application/Exports/ExportService*.cs`, PDF/Excel (compliance, SBOM) invoqués depuis `Application/TechHealth/{ExportExcel,ExportSbom}`

### Tests backend
- `backend/tests/Sentinel.Tests` : xunit.v3 + FluentAssertions + Testcontainers.PostgreSql + EFCore.InMemory
- Fixture `Helpers/PostgresFixture.cs` (`IAsyncLifetime`) : lance conteneur `postgres:17-alpine` (ou `SENTINEL_TEST_POSTGRES`), `Database.MigrateAsync()`, crée rôle restreint `sentinel_app` pour tests RLS. Partagée via `PostgresCollection : ICollectionFixture<PostgresFixture>`
- Autres helpers : `TestScope.cs`, `FakeTenantContext.cs`, `PostgresScope.cs`, `TestDbContextFactory.cs`

### Frontend : `domains/*` vs `features/*`
- `domains/*` = couche API/state uniquement, pas d'UI :
  - `queries.ts` : hooks TanStack Query `use<Entity>Query`, via wrapper partagé `useGetQuery` (`domains/helpers.ts`)
  - `mutations.ts` : hooks `use<Verb><Entity>Mutation`, via `usePostMutation`/`usePatchMutation`/`useDeleteMutation`, invalidation cache via `invalidateKeys([...])`
  - `constants.ts` : query keys + stale-time
  - `types.ts` : DTO/entités
  - `fetchers.ts` / `downloads.ts` : appels imperatifs ponctuels
- `features/*` = pages/UI :
  - `pages/*.tsx` : composants route-level
  - `routeGuards.ts` : protection de route
  - `schemas.ts` : schémas zod + `<Name>FormValues` (via `z.infer`), consommés par `useForm({ resolver: zodResolver(schema) })` — pattern par feature, pas de wrapper form partagé
  - Composants imbriqués : `components/<ComponentName>/index.tsx` (PascalCase, un dossier par composant)

## Conventions
- Zéro commentaire
- Backend = logique métier, Frontend = affichage/collecte
- Messages d'erreur en anglais côté API
- Avant tout travail frontend (composant, page, style) : consulter la page `/style-guide` (dev only, `frontend/src/features/styleGuide/pages/StyleGuidePage`) pour les tokens et patterns de composants réels de l'app

## CI/CD (`.github/workflows/ci.yml`)
- **frontend** : `pnpm ci:check` (Biome) → `lint:dead` (knip) → `pnpm audit --audit-level high` (bloquant) → `build` → `test:coverage` (pas de seuil % imposé, artifact uploadé)
- **backend** : `dotnet build` → tests + coverage (cobertura/trx) → audit NuGet vulnérabilités (`dotnet list package --vulnerable --include-transitive`, bloquant si CVE trouvée)
- **secret-scan** : gitleaks sur tout l'historique git
- **dependency-review** : sur PR uniquement
- Aucun gate de coverage % — coverage générée en artifact seulement
