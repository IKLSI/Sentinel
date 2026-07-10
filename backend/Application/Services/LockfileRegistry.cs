using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public readonly record struct LockfileInfo(DependencyEcosystem Ecosystem, string RegenerationCommand);

public static class LockfileRegistry
{
    private static readonly Dictionary<string, LockfileInfo> Map = new(StringComparer.OrdinalIgnoreCase)
    {
        ["package-lock.json"] = new(DependencyEcosystem.Npm, "npm install"),
        ["yarn.lock"] = new(DependencyEcosystem.Npm, "yarn install"),
        ["pnpm-lock.yaml"] = new(DependencyEcosystem.Npm, "pnpm install"),
        ["poetry.lock"] = new(DependencyEcosystem.PyPI, "poetry lock --no-update"),
        ["Pipfile.lock"] = new(DependencyEcosystem.PyPI, "pipenv lock"),
        ["composer.lock"] = new(DependencyEcosystem.Composer, "composer update --lock"),
        ["Cargo.lock"] = new(DependencyEcosystem.Cargo, "cargo update"),
        ["go.sum"] = new(DependencyEcosystem.Go, "go mod tidy"),
        ["Gemfile.lock"] = new(DependencyEcosystem.Gem, "bundle lock"),
        ["packages.lock.json"] = new(DependencyEcosystem.NuGet, "dotnet restore --force-evaluate"),
        ["mix.lock"] = new(DependencyEcosystem.Hex, "mix deps.get"),
        ["pubspec.lock"] = new(DependencyEcosystem.Pub, "dart pub get"),
        ["Package.resolved"] = new(DependencyEcosystem.Swift, "swift package resolve"),
        ["gradle.lockfile"] = new(DependencyEcosystem.Maven, "gradle dependencies --write-locks"),
    };

    public static bool TryGet(string fileName, out LockfileInfo info)
        => Map.TryGetValue(fileName, out info);
}
