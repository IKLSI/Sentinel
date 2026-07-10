using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Sentinel.Domain.Models;

namespace Sentinel.Application.Services;

public class ManifestParserService
{
    private static readonly HashSet<string> ManifestFileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "package.json",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "requirements.txt",
        "Pipfile.lock",
        "go.mod",
        "composer.json",
        "composer.lock",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "Gemfile",
        "Cargo.toml",
        "pyproject.toml",
        "CMakeLists.txt",
        "Cargo.lock",
        "packages.lock.json",
        "poetry.lock",
        "gradle.lockfile",
        "mix.exs",
        "mix.lock",
        "pubspec.yaml",
        "pubspec.lock",
        "Package.swift",
        "Package.resolved",
    };

    private static readonly HashSet<string> LockFileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "Pipfile.lock",
        "composer.lock",
        "Cargo.lock",
        "packages.lock.json",
        "poetry.lock",
        "gradle.lockfile",
        "mix.lock",
        "pubspec.lock",
        "Package.resolved",
    };

    public static bool IsManifest(string name)
        => ManifestFileNames.Contains(name) || name.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase);

    public static bool IsLockFile(string name)
        => LockFileNames.Contains(name);

    public (List<Dependency>, List<Runtime>) Parse(Guid projectId, string fileName, string content)
    {
        List<Dependency> deps = new List<Dependency>();
        List<Runtime> runtimes = new List<Runtime>();
        string lower = fileName.ToLowerInvariant();

        if (lower == "package.json") ParsePackageJson(projectId, content, deps, runtimes);
        else if (lower == "package-lock.json") ParsePackageLockJson(projectId, content, deps);
        else if (lower == "yarn.lock") ParseYarnLock(projectId, content, deps);
        else if (lower == "pnpm-lock.yaml") ParsePnpmLock(projectId, content, deps);
        else if (lower.EndsWith(".csproj")) ParseCsproj(projectId, content, deps, runtimes);
        else if (lower == "pom.xml") ParsePomXml(projectId, content, deps, runtimes);
        else if (lower == "requirements.txt") ParseRequirementsTxt(projectId, content, deps, runtimes);
        else if (lower == "pipfile.lock") ParsePipfileLock(projectId, content, deps);
        else if (lower == "pyproject.toml") ParsePyprojectToml(projectId, content, deps, runtimes);
        else if (lower == "go.mod") ParseGoMod(projectId, content, deps, runtimes);
        else if (lower == "composer.json") ParseComposerJson(projectId, content, deps, runtimes);
        else if (lower == "composer.lock") ParseComposerLock(projectId, content, deps);
        else if (lower is "build.gradle" or "build.gradle.kts") ParseBuildGradle(projectId, content, deps, runtimes);
        else if (lower == "gemfile") ParseGemfile(projectId, content, deps, runtimes);
        else if (lower == "cargo.toml") ParseCargoToml(projectId, content, deps, runtimes);
        else if (lower == "cmakelists.txt") ParseCMakeLists(projectId, content, runtimes);
        else if (lower == "cargo.lock") ParseCargoLock(projectId, content, deps);
        else if (lower == "packages.lock.json") ParseNuGetLockJson(projectId, content, deps);
        else if (lower == "poetry.lock") ParsePoetryLock(projectId, content, deps);
        else if (lower == "gradle.lockfile") ParseGradleLockfile(projectId, content, deps);
        else if (lower == "mix.exs") ParseMixExs(projectId, content, deps, runtimes);
        else if (lower == "mix.lock") ParseMixLock(projectId, content, deps);
        else if (lower == "pubspec.yaml") ParsePubspecYaml(projectId, content, deps, runtimes);
        else if (lower == "pubspec.lock") ParsePubspecLock(projectId, content, deps);
        else if (lower == "package.swift") ParsePackageSwift(projectId, content, runtimes);
        else if (lower == "package.resolved") ParsePackageResolved(projectId, content, deps);

        return (deps, runtimes);
    }

    private static void ParsePackageJson(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty("engines", out JsonElement engines) && engines.TryGetProperty("node", out JsonElement nodeProp))
            {
                string v = CleanVersion(nodeProp.GetString() ?? "");
                if (!string.IsNullOrEmpty(v))
                    runtimes.Add(new Runtime { ProjectId = projectId, Name = "Node.js", Version = v });
            }

            (string Name, string Version)? frameworkRuntime = DetectNpmFrameworkRuntime(root);
            if (frameworkRuntime.HasValue)
                runtimes.Add(new Runtime { ProjectId = projectId, Name = frameworkRuntime.Value.Name, Version = frameworkRuntime.Value.Version });

            if (root.TryGetProperty("dependencies", out JsonElement prodDeps))
                ExtractNpmDeps(projectId, prodDeps, DependencyType.Prod, deps);

            if (root.TryGetProperty("devDependencies", out JsonElement devDeps))
                ExtractNpmDeps(projectId, devDeps, DependencyType.Dev, deps);
        }
        catch { }
    }

    private static (string Name, string Version)? DetectNpmFrameworkRuntime(JsonElement root)
    {
        Dictionary<string, string> frameworkMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["react"] = "React",
            ["next"] = "Next.js",
            ["vue"] = "Vue",
            ["@angular/core"] = "Angular",
            ["svelte"] = "Svelte",
            ["@nestjs/core"] = "NestJS",
            ["express"] = "Express",
            ["fastify"] = "Fastify",
            ["@remix-run/react"] = "Remix",
            ["nuxt"] = "Nuxt",
            ["gatsby"] = "Gatsby",
            ["astro"] = "Astro",
        };

        foreach (string depsKey in new[] { "dependencies", "devDependencies" })
        {
            if (!root.TryGetProperty(depsKey, out JsonElement deps)) continue;
            foreach ((string? pkg, string? name) in frameworkMap)
            {
                if (deps.TryGetProperty(pkg, out JsonElement vProp))
                {
                    string v = CleanVersion(vProp.GetString() ?? "");
                    if (!string.IsNullOrEmpty(v))
                        return (name, v);
                }
            }
        }
        return null;
    }

    private static void ExtractNpmDeps(Guid projectId, JsonElement element, DependencyType type, List<Dependency> deps)
    {
        foreach (JsonProperty prop in element.EnumerateObject())
        {
            string v = CleanVersion(prop.Value.GetString() ?? "");
            if (string.IsNullOrEmpty(v)) continue;
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = prop.Name,
                CurrentVersion = v,
                Type = type,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseCsproj(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        try
        {
            XDocument doc = System.Xml.Linq.XDocument.Parse(content);

            string? tf = doc.Descendants("TargetFramework").FirstOrDefault()?.Value
                  ?? doc.Descendants("TargetFrameworks").FirstOrDefault()?.Value?.Split(';').FirstOrDefault();

            if (!string.IsNullOrEmpty(tf))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = ".NET", Version = ParseDotNetVersion(tf) });

            foreach (XElement pkgRef in doc.Descendants("PackageReference"))
            {
                string name = pkgRef.Attribute("Include")?.Value ?? "";
                string version = pkgRef.Attribute("Version")?.Value ?? pkgRef.Element("Version")?.Value ?? "";
                if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version)) continue;

                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = version,
                    Type = DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.NuGet,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
        catch { }
    }

    private static string ParseDotNetVersion(string tf)
    {
        Match m1 = Regex.Match(tf, @"net(\d+\.\d+)");
        if (m1.Success) return m1.Groups[1].Value;
        Match m2 = Regex.Match(tf, @"net(\d+)");
        if (m2.Success) return m2.Groups[1].Value + ".0";
        return tf;
    }

    private static void ParsePomXml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        try
        {
            XDocument doc = System.Xml.Linq.XDocument.Parse(content);
            XNamespace ns = doc.Root?.Name.Namespace ?? System.Xml.Linq.XNamespace.None;

            string? javaVersion = doc.Descendants(ns + "maven.compiler.source").FirstOrDefault()?.Value
                           ?? doc.Descendants(ns + "java.version").FirstOrDefault()?.Value;
            if (!string.IsNullOrEmpty(javaVersion))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = "Java", Version = javaVersion });

            foreach (XElement dep in doc.Descendants(ns + "dependency"))
            {
                string groupId = dep.Element(ns + "groupId")?.Value ?? "";
                string artifactId = dep.Element(ns + "artifactId")?.Value ?? "";
                string version = dep.Element(ns + "version")?.Value ?? "";
                string scope = dep.Element(ns + "scope")?.Value ?? "compile";

                if (string.IsNullOrEmpty(artifactId) || string.IsNullOrEmpty(version) || version.StartsWith('$')) continue;

                string name = string.IsNullOrEmpty(groupId) ? artifactId : $"{groupId}:{artifactId}";
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = version,
                    Type = scope == "test" ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Maven,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
        catch { }
    }

    private static void ParseBuildGradle(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Regex coordPattern = new Regex(
            @"(?:implementation|api|compileOnly|runtimeOnly|testImplementation|testRuntimeOnly|annotationProcessor|classpath)\s*[(""]([a-zA-Z0-9.\-_]+:[a-zA-Z0-9.\-_]+:[a-zA-Z0-9.\-_]+)[)""]",
            RegexOptions.Multiline);

        Regex namedPattern = new Regex(
            @"(?:implementation|api|compileOnly|runtimeOnly|testImplementation)\s+group\s*:\s*['""]([^'""]+)['""]\s*,\s*name\s*:\s*['""]([^'""]+)['""]\s*,\s*version\s*:\s*['""]([^'""]+)['""]",
            RegexOptions.Multiline);

        Match javaVersionMatch = Regex.Match(content, @"sourceCompatibility\s*[=:]\s*['""]?(\d[\d.]*)['""]?");
        if (javaVersionMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Java", Version = javaVersionMatch.Groups[1].Value });

        Match kotlinMatch = Regex.Match(content, @"kotlin\(['""]jvm['""]\)\s+version\s+['""]([^'""]+)['""]");
        if (kotlinMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Kotlin", Version = kotlinMatch.Groups[1].Value });

        foreach (Match m in coordPattern.Matches(content))
        {
            string coord = m.Groups[1].Value;
            string[] parts = coord.Split(':');
            if (parts.Length < 3) continue;

            string name = $"{parts[0]}:{parts[1]}";
            string version = parts[2];
            string config = m.Value.TrimStart();
            bool isTest = config.StartsWith("test", StringComparison.OrdinalIgnoreCase);

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = isTest ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Maven,
                Status = DependencyStatus.UpToDate,
            });
        }

        foreach (Match m in namedPattern.Matches(content))
        {
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = $"{m.Groups[1].Value}:{m.Groups[2].Value}",
                CurrentVersion = m.Groups[3].Value,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Maven,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseRequirementsTxt(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Dictionary<string, string> frameworkIndicators = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["django"] = "Django",
            ["flask"] = "Flask",
            ["fastapi"] = "FastAPI",
            ["tornado"] = "Tornado",
            ["aiohttp"] = "aiohttp",
        };

        foreach (string raw in content.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            string line = raw.Trim();
            if (line.StartsWith('#') || line.StartsWith('-') || string.IsNullOrEmpty(line)) continue;

            string[] parts = Regex.Split(line, @"[=><~!^;]+");
            string name = parts[0].Trim();
            string version = parts.Length > 1 ? parts[^1].Trim() : "";

            if (string.IsNullOrEmpty(name)) continue;

            if (frameworkIndicators.TryGetValue(name, out string? fw) && !string.IsNullOrEmpty(version))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = fw, Version = version });

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.PyPI,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParsePyprojectToml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match pythonMatch = Regex.Match(content, @"python\s*=\s*['""]([^'""]+)['""]");
        if (pythonMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Python", Version = CleanVersion(pythonMatch.Groups[1].Value) });

        MatchCollection poetryDepBlocks = Regex.Matches(content,
            @"\[tool\.poetry(?:\.group\.\w+)?\.dependencies\](.*?)(?=\[|\z)",
            RegexOptions.Singleline);

        foreach (Match block in poetryDepBlocks)
        {
            bool isDevBlock = block.Value.Contains("dev");
            foreach (Match dep in Regex.Matches(block.Groups[1].Value, @"^(\w[\w\-\.]+)\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline))
            {
                string name = dep.Groups[1].Value;
                if (name.Equals("python", StringComparison.OrdinalIgnoreCase)) continue;
                string version = CleanVersion(dep.Groups[2].Value);
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = version,
                    Type = isDevBlock ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.PyPI,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }

        Match pep517Match = Regex.Match(content, @"\[project\].*?dependencies\s*=\s*\[(.*?)\]", RegexOptions.Singleline);
        if (pep517Match.Success)
        {
            foreach (Match dep in Regex.Matches(pep517Match.Groups[1].Value, @"[""']([a-zA-Z0-9\-_\.]+)[>=<~!]+([a-zA-Z0-9.\-_]+)[""']"))
            {
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = dep.Groups[1].Value,
                    CurrentVersion = dep.Groups[2].Value,
                    Type = DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.PyPI,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }

        Dictionary<string, string> frameworkMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["django"] = "Django",
            ["flask"] = "Flask",
            ["fastapi"] = "FastAPI",
        };
        foreach (Dependency dep in deps)
        {
            if (frameworkMap.TryGetValue(dep.Name, out string? fw) && !string.IsNullOrEmpty(dep.CurrentVersion))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = fw, Version = dep.CurrentVersion });
        }
    }

    private static void ParseGoMod(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        bool inRequireBlock = false;

        foreach (string raw in content.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            string line = raw.Trim();

            if (line.StartsWith("go ") && !inRequireBlock)
            {
                runtimes.Add(new Runtime { ProjectId = projectId, Name = "Go", Version = line[3..].Trim() });
                continue;
            }

            if (line.StartsWith("require (") || line == "require(") { inRequireBlock = true; continue; }
            if (line == ")") { inRequireBlock = false; continue; }

            string? module = null, version = null;

            if (inRequireBlock && !line.StartsWith("//"))
            {
                string[] parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2) { module = parts[0]; version = parts[1].TrimStart('v'); }
            }
            else if (line.StartsWith("require ") && !line.Contains('('))
            {
                string[] parts = line[8..].Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2) { module = parts[0]; version = parts[1].TrimStart('v'); }
            }

            if (module == null || version == null || line.Contains("// indirect")) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = module,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Go,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseComposerJson(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            if (root.TryGetProperty("require", out JsonElement require))
            {
                foreach (JsonProperty prop in require.EnumerateObject())
                {
                    string version = CleanVersion(prop.Value.GetString() ?? "");

                    if (prop.Name.Equals("php", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrEmpty(version))
                            runtimes.Add(new Runtime { ProjectId = projectId, Name = "PHP", Version = version });
                        continue;
                    }

                    if (prop.Name.Equals("laravel/framework", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(version))
                        runtimes.Add(new Runtime { ProjectId = projectId, Name = "Laravel", Version = version });

                    if (prop.Name.Equals("symfony/symfony", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(version))
                        runtimes.Add(new Runtime { ProjectId = projectId, Name = "Symfony", Version = version });

                    if (string.IsNullOrEmpty(version)) continue;
                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = prop.Name,
                        CurrentVersion = version,
                        Type = DependencyType.Prod,
                        Ecosystem = DependencyEcosystem.Composer,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }

            if (root.TryGetProperty("require-dev", out JsonElement requireDev))
            {
                foreach (JsonProperty prop in requireDev.EnumerateObject())
                {
                    string version = CleanVersion(prop.Value.GetString() ?? "");
                    if (string.IsNullOrEmpty(version)) continue;
                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = prop.Name,
                        CurrentVersion = version,
                        Type = DependencyType.Dev,
                        Ecosystem = DependencyEcosystem.Composer,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }
        }
        catch { }
    }

    private static void ParseGemfile(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match rubyMatch = Regex.Match(content, @"^ruby\s+['""]([^'""]+)['""]", RegexOptions.Multiline);
        if (rubyMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Ruby", Version = CleanVersion(rubyMatch.Groups[1].Value) });

        Dictionary<string, string> frameworkMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["rails"] = "Rails",
            ["sinatra"] = "Sinatra",
            ["hanami"] = "Hanami",
        };

        Regex gemPattern = new Regex(@"^gem\s+['""]([^'""]+)['""](?:\s*,\s*['""]([^'""]*)['""])?", RegexOptions.Multiline);

        bool isInTest = false;
        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.StartsWith("group") && (line.Contains(":test") || line.Contains(":development"))) { isInTest = true; continue; }
            if (line == "end") { isInTest = false; continue; }

            Match m = gemPattern.Match(line);
            if (!m.Success) continue;

            string name = m.Groups[1].Value;
            string version = m.Groups[2].Success ? CleanVersion(m.Groups[2].Value) : "";

            if (frameworkMap.TryGetValue(name, out string? fw) && !string.IsNullOrEmpty(version))
                runtimes.Add(new Runtime { ProjectId = projectId, Name = fw, Version = version });

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = isInTest ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Gem,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseCargoToml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        runtimes.Add(new Runtime { ProjectId = projectId, Name = "Rust", Version = DetectRustEdition(content) });

        bool inDev = false;
        bool inDeps = false;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();

            if (line.StartsWith('['))
            {
                inDeps = line is "[dependencies]" or "[workspace.dependencies]";
                inDev = line is "[dev-dependencies]" or "[build-dependencies]";
                continue;
            }

            if (!inDeps && !inDev) continue;
            if (line.StartsWith('#') || string.IsNullOrEmpty(line)) continue;

            int eqIdx = line.IndexOf('=');
            if (eqIdx < 0) continue;

            string name = line[..eqIdx].Trim();
            string value = line[(eqIdx + 1)..].Trim();

            Match simpleMatch = Regex.Match(value, @"^[""']([^""']+)[""']$");
            if (simpleMatch.Success)
            {
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = simpleMatch.Groups[1].Value,
                    Type = inDev ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Cargo,
                    Status = DependencyStatus.UpToDate,
                });
                continue;
            }

            Match tableVersionMatch = Regex.Match(value, @"version\s*=\s*[""']([^""']+)[""']");
            if (tableVersionMatch.Success)
            {
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = tableVersionMatch.Groups[1].Value,
                    Type = inDev ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Cargo,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
    }

    private static string DetectRustEdition(string content)
    {
        Match m = Regex.Match(content, @"edition\s*=\s*[""'](\d{4})[""']");
        return m.Success ? m.Groups[1].Value : "unknown";
    }

    private static void ParseCMakeLists(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match cmakeVersionMatch = Regex.Match(content, @"cmake_minimum_required\s*\(\s*VERSION\s+([\d.]+)", RegexOptions.IgnoreCase);
        Match projectMatch = Regex.Match(content, @"project\s*\(.*?LANGUAGES\s+([\w\s]+)\)", RegexOptions.IgnoreCase | RegexOptions.Singleline);

        HashSet<string> languages = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (projectMatch.Success)
        {
            foreach (string lang in projectMatch.Groups[1].Value.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            {
                if (lang.Equals("C", StringComparison.OrdinalIgnoreCase)) languages.Add("C");
                else if (lang.Equals("CXX", StringComparison.OrdinalIgnoreCase)) languages.Add("C++");
                else if (lang.Equals("CUDA", StringComparison.OrdinalIgnoreCase)) languages.Add("CUDA");
                else if (lang.Equals("Fortran", StringComparison.OrdinalIgnoreCase)) languages.Add("Fortran");
            }
        }

        if (languages.Count == 0)
        {
            if (Regex.IsMatch(content, @"\.(cpp|cc|cxx)\b", RegexOptions.IgnoreCase)) languages.Add("C++");
            if (Regex.IsMatch(content, @"\.(c)\b")) languages.Add("C");
        }

        if (languages.Count == 0) languages.Add("C/C++");

        string cmakeVersion = cmakeVersionMatch.Success ? cmakeVersionMatch.Groups[1].Value : "";

        foreach (string lang in languages)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = lang, Version = cmakeVersion });
    }

    private static void ParsePackageLockJson(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            int lockfileVersion = root.TryGetProperty("lockfileVersion", out JsonElement vProp) ? vProp.GetInt32() : 1;

            if (lockfileVersion >= 2 && root.TryGetProperty("packages", out JsonElement packages))
            {
                foreach (JsonProperty pkg in packages.EnumerateObject())
                {
                    string key = pkg.Name;
                    if (!key.StartsWith("node_modules/", StringComparison.Ordinal)) continue;

                    string name = key["node_modules/".Length..];
                    if (string.IsNullOrEmpty(name)) continue;

                    if (name.Contains("/node_modules/")) continue;

                    string version = pkg.Value.TryGetProperty("version", out JsonElement ver) ? ver.GetString() ?? "" : "";
                    if (string.IsNullOrEmpty(version)) continue;

                    bool isDev = pkg.Value.TryGetProperty("dev", out JsonElement devProp) && devProp.GetBoolean();
                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = name,
                        CurrentVersion = version,
                        Type = isDev ? DependencyType.Dev : DependencyType.Prod,
                        Ecosystem = DependencyEcosystem.Npm,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }
            else if (root.TryGetProperty("dependencies", out JsonElement dependencies))
            {
                ExtractPackageLockV1Deps(projectId, dependencies, deps);
            }
        }
        catch { }
    }

    private static void ExtractPackageLockV1Deps(Guid projectId, JsonElement dependencies, List<Dependency> deps)
    {
        foreach (JsonProperty pkg in dependencies.EnumerateObject())
        {
            string version = pkg.Value.TryGetProperty("version", out JsonElement ver) ? ver.GetString() ?? "" : "";
            if (string.IsNullOrEmpty(version)) continue;

            bool isDev = pkg.Value.TryGetProperty("dev", out JsonElement devProp) && devProp.GetBoolean();
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = pkg.Name,
                CurrentVersion = version,
                Type = isDev ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
            });

            if (pkg.Value.TryGetProperty("dependencies", out JsonElement nested))
                ExtractPackageLockV1Deps(projectId, nested, deps);
        }
    }

    private static void ParseYarnLock(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            string? currentName = null;
            foreach (string raw in content.Split('\n'))
            {
                string line = raw.TrimEnd();

                if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
                {
                    currentName = null;
                    continue;
                }

                if (!line.StartsWith(' ') && line.EndsWith(':'))
                {
                    string firstEntry = line.TrimEnd(':').Split(',')[0].Trim().Trim('"');
                    int atIdx = firstEntry.LastIndexOf('@');
                    currentName = atIdx > 0 ? firstEntry[..atIdx] : null;
                    continue;
                }

                if (currentName == null) continue;

                Match vMatch = Regex.Match(line.Trim(), @"^version\s+[""']([^""']+)[""']");
                if (!vMatch.Success) continue;

                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = currentName,
                    CurrentVersion = vMatch.Groups[1].Value,
                    Type = DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Npm,
                    Status = DependencyStatus.UpToDate,
                });
                currentName = null;
            }
        }
        catch { }
    }

    private static void ParsePnpmLock(Guid projectId, string content, List<Dependency> deps)
    {
        Match versionMatch = Regex.Match(content, @"lockfileVersion:\s*['""]?(\d+)");
        int major = versionMatch.Success ? int.Parse(versionMatch.Groups[1].Value) : 9;

        bool inPackages = false;

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd();
            if (string.IsNullOrEmpty(line)) continue;

            if (!line.StartsWith(' '))
            {
                inPackages = line.StartsWith("packages:", StringComparison.Ordinal);
                continue;
            }

            if (!inPackages) continue;
            if (!Regex.IsMatch(line, @"^  \S")) continue;
            if (!line.EndsWith(':')) continue;

            string key = line.Trim().TrimEnd(':').Trim().Trim('\'', '"');
            (string? name, string? version) = ParsePnpmPackageKey(key, major);
            if (name == null || version == null) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = name,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Npm,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static (string?, string?) ParsePnpmPackageKey(string key, int major)
    {
        if (string.IsNullOrEmpty(key)) return (null, null);
        if (key.StartsWith('/')) key = key[1..];

        int paren = key.IndexOf('(');
        if (paren >= 0) key = key[..paren];

        string name, version;

        if (major <= 5)
        {
            int slash = key.LastIndexOf('/');
            if (slash <= 0) return (null, null);
            name = key[..slash];
            version = key[(slash + 1)..];
        }
        else
        {
            int at = key.LastIndexOf('@');
            if (at <= 0) return (null, null);
            name = key[..at];
            version = key[(at + 1)..];
        }

        if (name.Length == 0 || version.Length == 0 || !char.IsDigit(version[0]))
            return (null, null);

        return (name, version);
    }

    private static void ParseCargoLock(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match block in Regex.Matches(content, @"\[\[package\]\](.*?)(?=\[\[package\]\]|\z)", RegexOptions.Singleline))
        {
            string b = block.Groups[1].Value;
            Match nameMatch = Regex.Match(b, @"^\s*name\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            Match versionMatch = Regex.Match(b, @"^\s*version\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            if (!nameMatch.Success || !versionMatch.Success) continue;
            if (!Regex.IsMatch(b, @"^\s*source\s*=", RegexOptions.Multiline)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = nameMatch.Groups[1].Value,
                CurrentVersion = versionMatch.Groups[1].Value,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Cargo,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParsePoetryLock(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match block in Regex.Matches(content, @"\[\[package\]\](.*?)(?=\[\[package\]\]|\z)", RegexOptions.Singleline))
        {
            string b = block.Groups[1].Value;
            Match nameMatch = Regex.Match(b, @"^\s*name\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            Match versionMatch = Regex.Match(b, @"^\s*version\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            if (!nameMatch.Success || !versionMatch.Success) continue;

            Match categoryMatch = Regex.Match(b, @"^\s*category\s*=\s*[""']([^""']+)[""']", RegexOptions.Multiline);
            bool isDev = categoryMatch.Success && categoryMatch.Groups[1].Value.Equals("dev", StringComparison.OrdinalIgnoreCase);

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = nameMatch.Groups[1].Value,
                CurrentVersion = versionMatch.Groups[1].Value,
                Type = isDev ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.PyPI,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseNuGetLockJson(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            if (!doc.RootElement.TryGetProperty("dependencies", out JsonElement frameworks)) return;

            HashSet<string> seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (JsonProperty framework in frameworks.EnumerateObject())
            {
                foreach (JsonProperty pkg in framework.Value.EnumerateObject())
                {
                    string type = pkg.Value.TryGetProperty("type", out JsonElement t) ? t.GetString() ?? "" : "";
                    if (type.Equals("Project", StringComparison.OrdinalIgnoreCase)) continue;

                    string version = pkg.Value.TryGetProperty("resolved", out JsonElement r) ? r.GetString() ?? "" : "";
                    if (string.IsNullOrEmpty(version) || !seen.Add(pkg.Name)) continue;

                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = pkg.Name,
                        CurrentVersion = version,
                        Type = DependencyType.Prod,
                        Ecosystem = DependencyEcosystem.NuGet,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }
        }
        catch { }
    }

    private static void ParseGradleLockfile(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (string raw in content.Split('\n'))
        {
            string line = raw.Trim();
            if (line.StartsWith('#') || string.IsNullOrEmpty(line)) continue;

            int eq = line.IndexOf('=');
            if (eq <= 0) continue;

            string coord = line[..eq];
            string configs = line[(eq + 1)..];
            string[] parts = coord.Split(':');
            if (parts.Length < 3) continue;

            bool isTest = configs.Contains("test", StringComparison.OrdinalIgnoreCase);

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = $"{parts[0]}:{parts[1]}",
                CurrentVersion = parts[2],
                Type = isTest ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Maven,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseMixExs(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match elixirMatch = Regex.Match(content, @"elixir:\s*[""']([^""']+)[""']");
        if (elixirMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Elixir", Version = CleanVersion(elixirMatch.Groups[1].Value) });

        foreach (Match m in Regex.Matches(content, @"\{:(\w+)\s*,\s*[""']([\^~>=<\s]*\d[^""']*)[""']"))
        {
            string version = CleanVersion(m.Groups[2].Value);
            if (string.IsNullOrEmpty(version)) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = m.Groups[1].Value,
                CurrentVersion = version,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Hex,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParseMixLock(Guid projectId, string content, List<Dependency> deps)
    {
        foreach (Match m in Regex.Matches(content, @"[""']\w+[""']:\s*\{:hex,\s*:(\w+),\s*[""']([^""']+)[""']"))
        {
            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = m.Groups[1].Value,
                CurrentVersion = m.Groups[2].Value,
                Type = DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Hex,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParsePubspecYaml(Guid projectId, string content, List<Dependency> deps, List<Runtime> runtimes)
    {
        Match envBlock = Regex.Match(content, @"^environment:\s*\n((?:[ \t]+.*\n?)*)", RegexOptions.Multiline);
        if (envBlock.Success)
        {
            string env = envBlock.Groups[1].Value;
            Match dartMatch = Regex.Match(env, @"sdk:\s*[""']?[\^~>=<\s]*(\d[\d.]*)");
            if (dartMatch.Success)
                runtimes.Add(new Runtime { ProjectId = projectId, Name = "Dart", Version = dartMatch.Groups[1].Value });

            Match flutterMatch = Regex.Match(env, @"flutter:\s*[""']?[\^~>=<\s]*(\d[\d.]*)");
            if (flutterMatch.Success)
                runtimes.Add(new Runtime { ProjectId = projectId, Name = "Flutter", Version = flutterMatch.Groups[1].Value });
        }

        string? section = null;
        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd();
            if (line.Length == 0) continue;

            if (!line.StartsWith(' '))
            {
                section = line.StartsWith("dependencies:") ? "prod"
                        : line.StartsWith("dev_dependencies:") ? "dev"
                        : null;
                continue;
            }

            if (section == null) continue;

            Match m = Regex.Match(line, @"^  ([a-zA-Z0-9_]+):\s*(.*)$");
            if (!m.Success) continue;

            string rest = m.Groups[2].Value.Trim();
            if (rest.Length == 0) continue;

            string version = CleanVersion(rest.Trim('"', '\''));
            if (version.Length == 0 || !char.IsDigit(version[0])) continue;

            deps.Add(new Dependency
            {
                ProjectId = projectId,
                Name = m.Groups[1].Value,
                CurrentVersion = version,
                Type = section == "dev" ? DependencyType.Dev : DependencyType.Prod,
                Ecosystem = DependencyEcosystem.Pub,
                Status = DependencyStatus.UpToDate,
            });
        }
    }

    private static void ParsePubspecLock(Guid projectId, string content, List<Dependency> deps)
    {
        bool inPackages = false;
        string? name = null, version = null, dependency = null, source = null;

        void Flush()
        {
            if (name != null && !string.IsNullOrEmpty(version) && (source == null || source == "hosted"))
            {
                bool isDev = dependency != null && dependency.Contains("dev");
                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = name,
                    CurrentVersion = version,
                    Type = isDev ? DependencyType.Dev : DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Pub,
                    Status = DependencyStatus.UpToDate,
                });
            }
            name = version = dependency = source = null;
        }

        foreach (string raw in content.Split('\n'))
        {
            string line = raw.TrimEnd();
            if (line.Length == 0) continue;

            if (!line.StartsWith(' '))
            {
                Flush();
                inPackages = line.StartsWith("packages:");
                continue;
            }

            if (!inPackages) continue;

            Match pkgStart = Regex.Match(line, @"^  (\S[^:]*):\s*$");
            if (pkgStart.Success) { Flush(); name = pkgStart.Groups[1].Value; continue; }

            Match prop = Regex.Match(line, @"^    (version|dependency|source):\s*[""']?([^""'\n]+?)[""']?\s*$");
            if (!prop.Success) continue;

            switch (prop.Groups[1].Value)
            {
                case "version": version = prop.Groups[2].Value; break;
                case "dependency": dependency = prop.Groups[2].Value; break;
                case "source": source = prop.Groups[2].Value; break;
            }
        }
        Flush();
    }

    private static void ParsePackageSwift(Guid projectId, string content, List<Runtime> runtimes)
    {
        Match toolsMatch = Regex.Match(content, @"swift-tools-version:\s*([\d.]+)");
        if (toolsMatch.Success)
            runtimes.Add(new Runtime { ProjectId = projectId, Name = "Swift", Version = toolsMatch.Groups[1].Value });
    }

    private static void ParsePackageResolved(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            JsonElement pins;
            if (root.TryGetProperty("pins", out JsonElement p)) pins = p;
            else if (root.TryGetProperty("object", out JsonElement obj) && obj.TryGetProperty("pins", out JsonElement p1)) pins = p1;
            else return;

            foreach (JsonElement pin in pins.EnumerateArray())
            {
                string location =
                    pin.TryGetProperty("location", out JsonElement l) ? l.GetString() ?? "" :
                    pin.TryGetProperty("repositoryURL", out JsonElement r) ? r.GetString() ?? "" : "";
                if (string.IsNullOrEmpty(location)) continue;

                string? version = pin.TryGetProperty("state", out JsonElement state) && state.TryGetProperty("version", out JsonElement v)
                    ? v.GetString() : null;
                if (string.IsNullOrEmpty(version)) continue;

                deps.Add(new Dependency
                {
                    ProjectId = projectId,
                    Name = NormalizeSwiftUrl(location),
                    CurrentVersion = version,
                    Type = DependencyType.Prod,
                    Ecosystem = DependencyEcosystem.Swift,
                    Status = DependencyStatus.UpToDate,
                });
            }
        }
        catch { }
    }

    private static string NormalizeSwiftUrl(string url)
    {
        string s = Regex.Replace(url.Trim(), @"^https?://", "");
        s = Regex.Replace(s, @"\.git$", "");
        return s.TrimEnd('/');
    }

    private static void ParsePipfileLock(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            foreach ((string section, DependencyType type) in new[] { ("default", DependencyType.Prod), ("develop", DependencyType.Dev) })
            {
                if (!root.TryGetProperty(section, out JsonElement packages)) continue;

                foreach (JsonProperty pkg in packages.EnumerateObject())
                {
                    string version = pkg.Value.TryGetProperty("version", out JsonElement vProp)
                        ? CleanVersion(vProp.GetString() ?? "")
                        : "";

                    if (string.IsNullOrEmpty(version)) continue;

                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = pkg.Name,
                        CurrentVersion = version,
                        Type = type,
                        Ecosystem = DependencyEcosystem.PyPI,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }
        }
        catch { }
    }

    private static void ParseComposerLock(Guid projectId, string content, List<Dependency> deps)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(content);
            JsonElement root = doc.RootElement;

            foreach ((string section, DependencyType type) in new[] { ("packages", DependencyType.Prod), ("packages-dev", DependencyType.Dev) })
            {
                if (!root.TryGetProperty(section, out JsonElement packages)) continue;

                foreach (JsonElement pkg in packages.EnumerateArray())
                {
                    string name = pkg.TryGetProperty("name", out JsonElement n) ? n.GetString() ?? "" : "";
                    string version = pkg.TryGetProperty("version", out JsonElement v) ? CleanVersion(v.GetString() ?? "") : "";

                    if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version)) continue;

                    deps.Add(new Dependency
                    {
                        ProjectId = projectId,
                        Name = name,
                        CurrentVersion = version,
                        Type = type,
                        Ecosystem = DependencyEcosystem.Composer,
                        Status = DependencyStatus.UpToDate,
                    });
                }
            }
        }
        catch { }
    }

    internal static string CleanVersion(string version)
        => Regex.Replace(version.Trim(), @"^[\^~>=<\s=]+", "").Split([' ', ','])[0].Trim();
}
