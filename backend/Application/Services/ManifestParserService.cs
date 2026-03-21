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
        "requirements.txt",
        "go.mod",
        "composer.json",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "Gemfile",
        "Cargo.toml",
        "pyproject.toml",
        "CMakeLists.txt",
    };

    public static bool IsManifest(string name)
        => ManifestFileNames.Contains(name) || name.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase);

    public (List<Dependency>, List<Runtime>) Parse(Guid projectId, string fileName, string content)
    {
        List<Dependency> deps = new List<Dependency>();
        List<Runtime> runtimes = new List<Runtime>();
        string lower = fileName.ToLowerInvariant();

        if (lower == "package.json") ParsePackageJson(projectId, content, deps, runtimes);
        else if (lower.EndsWith(".csproj")) ParseCsproj(projectId, content, deps, runtimes);
        else if (lower == "pom.xml") ParsePomXml(projectId, content, deps, runtimes);
        else if (lower == "requirements.txt") ParseRequirementsTxt(projectId, content, deps, runtimes);
        else if (lower == "pyproject.toml") ParsePyprojectToml(projectId, content, deps, runtimes);
        else if (lower == "go.mod") ParseGoMod(projectId, content, deps, runtimes);
        else if (lower == "composer.json") ParseComposerJson(projectId, content, deps, runtimes);
        else if (lower is "build.gradle" or "build.gradle.kts") ParseBuildGradle(projectId, content, deps, runtimes);
        else if (lower == "gemfile") ParseGemfile(projectId, content, deps, runtimes);
        else if (lower == "cargo.toml") ParseCargoToml(projectId, content, deps, runtimes);
        else if (lower == "cmakelists.txt") ParseCMakeLists(projectId, content, runtimes);

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
                    runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Node.js", Version = v });
            }

            (string Name, string Version)? frameworkRuntime = DetectNpmFrameworkRuntime(root);
            if (frameworkRuntime.HasValue)
                runtimes.Add(new Runtime { TechProjectId = projectId, Name = frameworkRuntime.Value.Name, Version = frameworkRuntime.Value.Version });

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

        if (!root.TryGetProperty("dependencies", out JsonElement deps)) return null;

        foreach ((string? pkg, string? name) in frameworkMap)
        {
            if (deps.TryGetProperty(pkg, out JsonElement vProp))
            {
                string v = CleanVersion(vProp.GetString() ?? "");
                if (!string.IsNullOrEmpty(v))
                    return (name, v);
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
                TechProjectId = projectId,
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
                runtimes.Add(new Runtime { TechProjectId = projectId, Name = ".NET", Version = ParseDotNetVersion(tf) });

            foreach (XElement pkgRef in doc.Descendants("PackageReference"))
            {
                string name = pkgRef.Attribute("Include")?.Value ?? "";
                string version = pkgRef.Attribute("Version")?.Value ?? pkgRef.Element("Version")?.Value ?? "";
                if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(version)) continue;

                deps.Add(new Dependency
                {
                    TechProjectId = projectId,
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
                runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Java", Version = javaVersion });

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
                    TechProjectId = projectId,
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
            runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Java", Version = javaVersionMatch.Groups[1].Value });

        Match kotlinMatch = Regex.Match(content, @"kotlin\(['""]jvm['""]\)\s+version\s+['""]([^'""]+)['""]");
        if (kotlinMatch.Success)
            runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Kotlin", Version = kotlinMatch.Groups[1].Value });

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
                TechProjectId = projectId,
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
                TechProjectId = projectId,
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
                runtimes.Add(new Runtime { TechProjectId = projectId, Name = fw, Version = version });

            deps.Add(new Dependency
            {
                TechProjectId = projectId,
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
            runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Python", Version = CleanVersion(pythonMatch.Groups[1].Value) });

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
                    TechProjectId = projectId,
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
                    TechProjectId = projectId,
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
                runtimes.Add(new Runtime { TechProjectId = projectId, Name = fw, Version = dep.CurrentVersion });
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
                runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Go", Version = line[3..].Trim() });
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
                TechProjectId = projectId,
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
                            runtimes.Add(new Runtime { TechProjectId = projectId, Name = "PHP", Version = version });
                        continue;
                    }

                    if (prop.Name.Equals("laravel/framework", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(version))
                        runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Laravel", Version = version });

                    if (prop.Name.Equals("symfony/symfony", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(version))
                        runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Symfony", Version = version });

                    if (string.IsNullOrEmpty(version)) continue;
                    deps.Add(new Dependency
                    {
                        TechProjectId = projectId,
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
                        TechProjectId = projectId,
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
            runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Ruby", Version = CleanVersion(rubyMatch.Groups[1].Value) });

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
                runtimes.Add(new Runtime { TechProjectId = projectId, Name = fw, Version = version });

            deps.Add(new Dependency
            {
                TechProjectId = projectId,
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
        runtimes.Add(new Runtime { TechProjectId = projectId, Name = "Rust", Version = DetectRustEdition(content) });

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
                    TechProjectId = projectId,
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
                    TechProjectId = projectId,
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
            runtimes.Add(new Runtime { TechProjectId = projectId, Name = lang, Version = cmakeVersion });
    }

    public static string CleanVersion(string version)
        => Regex.Replace(version.Trim(), @"^[\^~>=<\s]+", "").Split([' ', ','])[0].Trim();
}
