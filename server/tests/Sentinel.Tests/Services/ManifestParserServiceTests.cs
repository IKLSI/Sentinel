using FluentAssertions;
using Sentinel.Application.Scanning;
using Sentinel.Domain.Entities;

namespace Sentinel.Tests.Services;

public class ManifestParserServiceTests
{
    private static readonly Guid ProjectId = Guid.NewGuid();

    private static (List<Dependency> Dependencies, List<Runtime> Runtimes) Parse(string fileName, string content)
        => new ManifestParserService().Parse(ProjectId, fileName, content);

    private static Dependency SingleDependency(List<Dependency> dependencies, string name)
        => dependencies.Should().ContainSingle(dependency => dependency.Name == name).Subject;

    private static Runtime SingleRuntime(List<Runtime> runtimes, string name)
        => runtimes.Should().ContainSingle(runtime => runtime.Name == name).Subject;

    [Theory]
    [InlineData("package.json", true)]
    [InlineData("Sentinel.API.csproj", true)]
    [InlineData("pnpm-lock.yaml", true)]
    [InlineData("Directory.Packages.props", true)]
    [InlineData("libs.versions.toml", true)]
    [InlineData("App.fsproj", true)]
    [InlineData("App.vbproj", true)]
    [InlineData("Dockerfile", true)]
    [InlineData(".nvmrc", true)]
    [InlineData(".tool-versions", true)]
    [InlineData("global.json", true)]
    [InlineData("rust-toolchain.toml", true)]
    [InlineData("README.md", false)]
    [InlineData("package.json.bak", false)]
    public void IsManifest_RecognizesSupportedFiles(string fileName, bool expected)
    {
        ManifestParserService.IsManifest(fileName).Should().Be(expected);
    }

    [Theory]
    [InlineData("package-lock.json", true)]
    [InlineData("package.json", false)]
    [InlineData("Cargo.lock", true)]
    [InlineData("Cargo.toml", false)]
    public void IsLockFile_SeparatesResolvedFromDeclaredManifests(string fileName, bool expected)
    {
        ManifestParserService.IsLockFile(fileName).Should().Be(expected);
    }

    [Theory]
    [InlineData(".tool-versions", 0)]
    [InlineData("Dockerfile", 0)]
    [InlineData(".nvmrc", 0)]
    [InlineData("package-lock.json", 1)]
    [InlineData("package.json", 2)]
    public void ScanPriority_ReadsRuntimeDeclarationsThenLockFilesBeforeManifests(string fileName, int expected)
    {
        ManifestParserService.ScanPriority(fileName).Should().Be(expected);
    }

    [Fact]
    public void ParsePackageJson_ExtractsDependenciesRuntimeAndFramework()
    {
        const string content = """
        {
          "engines": { "node": "^20.11.0" },
          "dependencies": { "react": "^19.0.0", "axios": "1.6.8" },
          "devDependencies": { "vitest": "^3.0.0" }
        }
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("package.json", content);

        dependencies.Should().HaveCount(3);
        SingleDependency(dependencies, "react").CurrentVersion.Should().Be("19.0.0");
        SingleDependency(dependencies, "react").Type.Should().Be(DependencyType.Prod);
        SingleDependency(dependencies, "vitest").Type.Should().Be(DependencyType.Dev);
        dependencies.Should().OnlyContain(dependency => dependency.Ecosystem == DependencyEcosystem.Npm);
        SingleRuntime(runtimes, "Node.js").Version.Should().Be("20.11.0");
        SingleRuntime(runtimes, "React").Version.Should().Be("19.0.0");
    }

    [Fact]
    public void ParsePackageLockJson_V3_IncludesNestedPackages()
    {
        const string content = """
        {
          "lockfileVersion": 3,
          "packages": {
            "": { "name": "root", "version": "1.0.0" },
            "node_modules/axios": { "version": "1.6.8" },
            "node_modules/vitest": { "version": "3.0.1", "dev": true },
            "node_modules/axios/node_modules/follow-redirects": { "version": "1.15.6" }
          }
        }
        """;

        (List<Dependency> dependencies, _) = Parse("package-lock.json", content);

        dependencies.Should().HaveCount(3);
        SingleDependency(dependencies, "axios").CurrentVersion.Should().Be("1.6.8");
        SingleDependency(dependencies, "vitest").Type.Should().Be(DependencyType.Dev);
        SingleDependency(dependencies, "follow-redirects").CurrentVersion.Should().Be("1.15.6");
    }

    [Fact]
    public void ParsePackageLockV3_DevOptionalEntry_IsDev()
    {
        const string content = """
        {
          "lockfileVersion": 3,
          "packages": {
            "node_modules/fsevents": { "version": "2.3.3", "devOptional": true }
          }
        }
        """;

        (List<Dependency> dependencies, _) = Parse("package-lock.json", content);

        SingleDependency(dependencies, "fsevents").Type.Should().Be(DependencyType.Dev);
    }

    [Fact]
    public void ParsePackageLockV3_AliasedEntry_UsesTheRealPackageName()
    {
        const string content = """
        {
          "lockfileVersion": 3,
          "packages": {
            "": { "dependencies": { "legacy-lodash": "npm:lodash@4.17.20" } },
            "node_modules/legacy-lodash": { "name": "lodash", "version": "4.17.20" }
          }
        }
        """;

        (List<Dependency> dependencies, _) = Parse("package-lock.json", content);

        Dependency lodash = SingleDependency(dependencies, "lodash");
        lodash.CurrentVersion.Should().Be("4.17.20");
        lodash.IsDirect.Should().BeTrue();
    }

    [Fact]
    public void ParsePackageJson_AliasedDependency_UsesTheRealPackageName()
    {
        (List<Dependency> dependencies, _) = Parse("package.json",
            """{ "dependencies": { "legacy-lodash": "npm:lodash@4.17.20" } }""");

        SingleDependency(dependencies, "lodash").CurrentVersion.Should().Be("4.17.20");
    }

    [Fact]
    public void ParseYarnLock_ReadsClassicEntries()
    {
        const string content = """
        # yarn lockfile v1

        axios@^1.6.0:
          version "1.6.8"
          resolved "https://registry.yarnpkg.com/axios/-/axios-1.6.8.tgz"

        "@babel/core@^7.24.0":
          version "7.24.3"
        """;

        (List<Dependency> dependencies, _) = Parse("yarn.lock", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "axios").CurrentVersion.Should().Be("1.6.8");
        SingleDependency(dependencies, "@babel/core").CurrentVersion.Should().Be("7.24.3");
    }

    [Fact]
    public void ParsePnpmLock_V9_ReadsScopedAndPlainPackages()
    {
        const string content = """
        lockfileVersion: '9.0'

        packages:

          axios@1.6.8:
            resolution: {integrity: sha512-aaa}

          '@babel/core@7.24.3':
            resolution: {integrity: sha512-bbb}
        """;

        (List<Dependency> dependencies, _) = Parse("pnpm-lock.yaml", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "axios").CurrentVersion.Should().Be("1.6.8");
        SingleDependency(dependencies, "@babel/core").CurrentVersion.Should().Be("7.24.3");
    }

    [Fact]
    public void ParsePnpmLock_MarksDevFlaggedPackagesAsDev()
    {
        const string content = """
        lockfileVersion: 5.4

        packages:

          /axios/1.6.8:
            resolution: {integrity: sha512-aaa}
            dev: false

          /jest/29.7.0:
            resolution: {integrity: sha512-bbb}
            dev: true
        """;

        (List<Dependency> dependencies, _) = Parse("pnpm-lock.yaml", content);

        SingleDependency(dependencies, "axios").Type.Should().Be(DependencyType.Prod);
        SingleDependency(dependencies, "jest").Type.Should().Be(DependencyType.Dev);
    }

    [Fact]
    public void ParsePackageJson_FrameworkRuntimeFromRangeIsAMinimumConstraint()
    {
        const string content = """
        { "dependencies": { "react": "^16.14.0" } }
        """;

        (_, List<Runtime> runtimes) = Parse("package.json", content);

        SingleRuntime(runtimes, "React").IsMinimumConstraint.Should().BeTrue();
    }

    [Fact]
    public void ParsePackageJson_FrameworkRuntimeFromExactVersionIsNotAMinimumConstraint()
    {
        const string content = """
        { "dependencies": { "react": "19.0.0" } }
        """;

        (_, List<Runtime> runtimes) = Parse("package.json", content);

        SingleRuntime(runtimes, "React").IsMinimumConstraint.Should().BeFalse();
    }

    [Fact]
    public void ParseRequirementsTxt_FrameworkRuntimeFromLowerBoundIsAMinimumConstraint()
    {
        (_, List<Runtime> runtimes) = Parse("requirements.txt", "Django>=3.2\n");

        SingleRuntime(runtimes, "Django").IsMinimumConstraint.Should().BeTrue();
    }

    [Fact]
    public void ParsePnpmLock_V5_DropsThePeerSuffixFromTheVersion()
    {
        const string content = """
        lockfileVersion: 5.4

        packages:

          /react-dom/18.2.0_react@18.2.0:
            resolution: {integrity: sha512-aaa}
        """;

        (List<Dependency> dependencies, _) = Parse("pnpm-lock.yaml", content);

        SingleDependency(dependencies, "react-dom").CurrentVersion.Should().Be("18.2.0");
    }

    [Fact]
    public void ParseRequirementsTxt_IgnoresBareUrlsAndKeepsTheEggName()
    {
        const string content = """
        https://example.org/pkg/archive/main.zip
        git+https://github.com/acme/lib.git#egg=lib
        requests==2.31.0
        """;

        (List<Dependency> dependencies, _) = Parse("requirements.txt", content);

        dependencies.Select(dependency => dependency.Name).Should().BeEquivalentTo("lib", "requests");
    }

    [Fact]
    public void ParseCargoToml_ReadsDependencySubTables()
    {
        const string content = """
        [dependencies.tokio]
        version = "1.38.0"
        features = ["full"]

        [dev-dependencies.insta]
        version = "1.39.0"
        """;

        (List<Dependency> dependencies, _) = Parse("Cargo.toml", content);

        SingleDependency(dependencies, "tokio").CurrentVersion.Should().Be("1.38.0");
        SingleDependency(dependencies, "tokio").Type.Should().Be(DependencyType.Prod);
        SingleDependency(dependencies, "insta").Type.Should().Be(DependencyType.Dev);
    }

    [Fact]
    public void ParseNuGetLockJson_KeepsEachResolvedVersionAndMergesDirectness()
    {
        const string content = """
        {
          "version": 1,
          "dependencies": {
            "net8.0": { "Newtonsoft.Json": { "type": "Transitive", "resolved": "13.0.1" } },
            "net48": {
              "Newtonsoft.Json": { "type": "Direct", "resolved": "13.0.1" },
              "Serilog": { "type": "Direct", "resolved": "3.0.0" }
            },
            "net9.0": { "Serilog": { "type": "Direct", "resolved": "4.0.0" } }
          }
        }
        """;

        (List<Dependency> dependencies, _) = Parse("packages.lock.json", content);

        dependencies.Should().HaveCount(3);
        dependencies.Single(d => d.Name == "Newtonsoft.Json").IsDirect.Should().BeTrue();
        dependencies.Where(d => d.Name == "Serilog").Select(d => d.CurrentVersion)
            .Should().BeEquivalentTo("3.0.0", "4.0.0");
    }

    [Fact]
    public void ParseRequirementsTxt_UsesTheLowerBoundNotTheUpperBound()
    {
        const string content = """
        # production
        Django>=3.2,<4.0
        requests==2.31.0
        uvicorn[standard]==0.29.0
        pytest>=7.0 ; python_version >= "3.8"
        flask
        -r other-requirements.txt
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("requirements.txt", content);

        dependencies.Should().HaveCount(5);
        SingleDependency(dependencies, "Django").CurrentVersion.Should().Be("3.2");
        SingleDependency(dependencies, "requests").CurrentVersion.Should().Be("2.31.0");
        SingleDependency(dependencies, "uvicorn").CurrentVersion.Should().Be("0.29.0");
        SingleDependency(dependencies, "pytest").CurrentVersion.Should().Be("7.0");
        SingleDependency(dependencies, "flask").CurrentVersion.Should().BeEmpty();
        SingleRuntime(runtimes, "Django").Version.Should().Be("3.2");
    }

    [Fact]
    public void ParseRequirementsTxt_PinnedWildcardKeepsTheNumericPrefix()
    {
        (List<Dependency> dependencies, _) = Parse("requirements.txt", "Django==4.2.*");

        SingleDependency(dependencies, "Django").CurrentVersion.Should().Be("4.2");
    }

    [Fact]
    public void ParsePyprojectToml_ReadsPoetryGroupsAndPythonRuntime()
    {
        const string content = """
        [tool.poetry.dependencies]
        python = "^3.12"
        requests = "^2.31.0"

        [tool.poetry.group.dev.dependencies]
        pytest = "^8.1.1"
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("pyproject.toml", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "requests").Type.Should().Be(DependencyType.Prod);
        SingleDependency(dependencies, "pytest").Type.Should().Be(DependencyType.Dev);
        SingleRuntime(runtimes, "Python").Version.Should().Be("3.12");
    }

    [Fact]
    public void ParsePyprojectToml_ReadsPep621Dependencies()
    {
        const string content = """
        [project]
        name = "app"
        dependencies = ["fastapi>=0.110.0", "httpx"]
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("pyproject.toml", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "fastapi").CurrentVersion.Should().Be("0.110.0");
        SingleDependency(dependencies, "httpx").IsVersionPinned.Should().BeFalse();
        SingleRuntime(runtimes, "FastAPI").Version.Should().Be("0.110.0");
    }

    [Fact]
    public void ParsePoetryLock_ReadsPackageBlocks()
    {
        const string content = """
        [[package]]
        name = "requests"
        version = "2.31.0"
        category = "main"

        [[package]]
        name = "pytest"
        version = "8.1.1"
        category = "dev"
        """;

        (List<Dependency> dependencies, _) = Parse("poetry.lock", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "requests").Type.Should().Be(DependencyType.Prod);
        SingleDependency(dependencies, "pytest").Type.Should().Be(DependencyType.Dev);
    }

    [Fact]
    public void ParsePipfileLock_SeparatesDefaultFromDevelop()
    {
        const string content = """
        {
          "default": { "requests": { "version": "==2.31.0" } },
          "develop": { "pytest": { "version": "==8.1.1" } }
        }
        """;

        (List<Dependency> dependencies, _) = Parse("Pipfile.lock", content);

        SingleDependency(dependencies, "requests").CurrentVersion.Should().Be("2.31.0");
        SingleDependency(dependencies, "pytest").Type.Should().Be(DependencyType.Dev);
    }

    [Fact]
    public void ParseCsproj_ReadsTargetFrameworkAndPackageReferences()
    {
        const string content = """
        <Project Sdk="Microsoft.NET.Sdk">
          <PropertyGroup>
            <TargetFramework>net10.0</TargetFramework>
          </PropertyGroup>
          <ItemGroup>
            <PackageReference Include="Serilog" Version="4.2.0" />
            <PackageReference Include="Hangfire">
              <Version>1.8.14</Version>
            </PackageReference>
          </ItemGroup>
        </Project>
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("Sentinel.API.csproj", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "Serilog").CurrentVersion.Should().Be("4.2.0");
        SingleDependency(dependencies, "Hangfire").CurrentVersion.Should().Be("1.8.14");
        dependencies.Should().OnlyContain(dependency => dependency.Ecosystem == DependencyEcosystem.NuGet);
        SingleRuntime(runtimes, ".NET").Version.Should().Be("10.0");
    }

    [Fact]
    public void ParsePomXml_ReadsCoordinatesScopeAndJavaVersion()
    {
        const string content = """
        <project xmlns="http://maven.apache.org/POM/4.0.0">
          <properties>
            <maven.compiler.source>21</maven.compiler.source>
          </properties>
          <dependencies>
            <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-starter-web</artifactId>
              <version>3.2.3</version>
            </dependency>
            <dependency>
              <groupId>org.junit.jupiter</groupId>
              <artifactId>junit-jupiter</artifactId>
              <version>5.10.2</version>
              <scope>test</scope>
            </dependency>
            <dependency>
              <groupId>com.example</groupId>
              <artifactId>unresolved</artifactId>
              <version>${example.version}</version>
            </dependency>
          </dependencies>
        </project>
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("pom.xml", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "org.springframework.boot:spring-boot-starter-web").CurrentVersion.Should().Be("3.2.3");
        SingleDependency(dependencies, "org.junit.jupiter:junit-jupiter").Type.Should().Be(DependencyType.Dev);
        SingleRuntime(runtimes, "Java").Version.Should().Be("21");
    }

    [Fact]
    public void ParseBuildGradle_ReadsGroovySingleQuotedCoordinates()
    {
        const string content = """
        plugins {
            kotlin("jvm") version "1.9.22"
        }

        sourceCompatibility = '17'

        dependencies {
            implementation 'org.springframework.boot:spring-boot-starter-web:3.2.3'
            testImplementation "org.junit.jupiter:junit-jupiter:5.10.2"
        }
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("build.gradle", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "org.springframework.boot:spring-boot-starter-web").CurrentVersion.Should().Be("3.2.3");
        SingleDependency(dependencies, "org.junit.jupiter:junit-jupiter").Type.Should().Be(DependencyType.Dev);
        SingleRuntime(runtimes, "Java").Version.Should().Be("17");
        SingleRuntime(runtimes, "Kotlin").Version.Should().Be("1.9.22");
    }

    [Fact]
    public void ParseDirectoryPackagesProps_ReadsCentrallyManagedVersions()
    {
        const string content = """
        <Project>
          <PropertyGroup>
            <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
          </PropertyGroup>
          <ItemGroup>
            <PackageVersion Include="Serilog" Version="4.2.0" />
            <PackageVersion Include="Hangfire" Version="1.8.14" />
            <PackageVersion Include="Unresolved" Version="$(UnresolvedVersion)" />
          </ItemGroup>
        </Project>
        """;

        (List<Dependency> dependencies, _) = Parse("Directory.Packages.props", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "Serilog").CurrentVersion.Should().Be("4.2.0");
        dependencies.Should().OnlyContain(dependency => dependency.Ecosystem == DependencyEcosystem.NuGet);
    }

    [Fact]
    public void ParseVersionCatalog_ResolvesEveryLibraryNotation()
    {
        const string content = """
        [versions]
        junit = "5.10.2"

        [libraries]
        guava = { module = "com.google.guava:guava", version = "33.0.0-jre" }
        junit = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit" }
        retrofit = "com.squareup.retrofit2:retrofit:2.11.0"
        split = { group = "io.ktor", name = "ktor-client-core", version = "2.3.9" }
        dangling = { module = "com.example:lib", version.ref = "missing" }

        [plugins]
        kotlin = { id = "org.jetbrains.kotlin.jvm", version.ref = "junit" }
        """;

        (List<Dependency> dependencies, _) = Parse("libs.versions.toml", content);

        dependencies.Should().HaveCount(4);
        SingleDependency(dependencies, "com.google.guava:guava").CurrentVersion.Should().Be("33.0.0-jre");
        SingleDependency(dependencies, "org.junit.jupiter:junit-jupiter").CurrentVersion.Should().Be("5.10.2");
        SingleDependency(dependencies, "com.squareup.retrofit2:retrofit").CurrentVersion.Should().Be("2.11.0");
        SingleDependency(dependencies, "io.ktor:ktor-client-core").CurrentVersion.Should().Be("2.3.9");
        dependencies.Should().OnlyContain(dependency => dependency.Ecosystem == DependencyEcosystem.Maven);
    }

    [Fact]
    public void ParseYarnLock_ReadsBerryEntries()
    {
        const string content = """
        # This file is generated by running "yarn install"

        __metadata:
          version: 8
          cacheKey: 10c0

        "axios@npm:^1.6.0":
          version: 1.6.8
          resolution: "axios@npm:1.6.8"
          languageName: node

        "@babel/core@npm:^7.24.0":
          version: 7.24.3
          resolution: "@babel/core@npm:7.24.3"
        """;

        (List<Dependency> dependencies, _) = Parse("yarn.lock", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "axios").CurrentVersion.Should().Be("1.6.8");
        SingleDependency(dependencies, "@babel/core").CurrentVersion.Should().Be("7.24.3");
    }

    [Fact]
    public void ParseYarnLock_ResolvesAliasesAndSkipsNonRegistryProtocols()
    {
        const string content = """
        __metadata:
          version: 8

        "string-width-cjs@npm:string-width@^4.2.0":
          version: 4.2.3

        "my-app@workspace:.":
          version: 0.0.0-use.local

        "patched@patch:patched@npm%3A1.0.0#./patches/patched.patch":
          version: 1.0.0

        classic-alias@npm:@scope/real@^2.0.0:
          version "2.1.0"
        """;

        (List<Dependency> dependencies, _) = Parse("yarn.lock", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "string-width").CurrentVersion.Should().Be("4.2.3");
        SingleDependency(dependencies, "@scope/real").CurrentVersion.Should().Be("2.1.0");
    }

    [Fact]
    public void ParseReportingFailure_RejectsXmlManifestDeclaringDtd()
    {
        const string content = """
        <?xml version="1.0"?>
        <!DOCTYPE Project [<!ENTITY lol "lol">]>
        <Project><ItemGroup><PackageReference Include="Serilog" Version="&lol;" /></ItemGroup></Project>
        """;

        ManifestParseOutcome outcome = new ManifestParserService().ParseReportingFailure(ProjectId, "App.csproj", content);

        outcome.Failure.Should().BeOfType<System.Xml.XmlException>();
        outcome.Dependencies.Should().BeEmpty();
    }

    [Fact]
    public void ParsePomXml_ResolvesVersionsDeclaredAsProperties()
    {
        const string content = """
        <project xmlns="http://maven.apache.org/POM/4.0.0">
          <properties>
            <spring.version>6.1.5</spring.version>
          </properties>
          <dependencies>
            <dependency>
              <groupId>org.springframework</groupId>
              <artifactId>spring-core</artifactId>
              <version>${spring.version}</version>
            </dependency>
            <dependency>
              <groupId>com.example</groupId>
              <artifactId>unknown</artifactId>
              <version>${missing.version}</version>
            </dependency>
          </dependencies>
        </project>
        """;

        (List<Dependency> dependencies, _) = Parse("pom.xml", content);

        dependencies.Should().ContainSingle();
        SingleDependency(dependencies, "org.springframework:spring-core").CurrentVersion.Should().Be("6.1.5");
    }

    [Fact]
    public void ParseNuGetLockJson_SkipsProjectReferences()
    {
        const string content = """
        {
          "version": 1,
          "dependencies": {
            "net10.0": {
              "Serilog": { "type": "Direct", "resolved": "4.2.0" },
              "Sentinel.Domain": { "type": "Project" }
            }
          }
        }
        """;

        (List<Dependency> dependencies, _) = Parse("packages.lock.json", content);

        dependencies.Should().ContainSingle();
        SingleDependency(dependencies, "Serilog").CurrentVersion.Should().Be("4.2.0");
    }

    [Fact]
    public void ParseNuGetLockJson_FlagsTransitivePackages()
    {
        const string content = """
        {
          "version": 1,
          "dependencies": {
            "net10.0": {
              "Serilog": { "type": "Direct", "resolved": "4.2.0" },
              "System.Text.Json": { "type": "Transitive", "resolved": "10.0.0" }
            }
          }
        }
        """;

        (List<Dependency> dependencies, _) = Parse("packages.lock.json", content);

        SingleDependency(dependencies, "Serilog").IsDirect.Should().BeTrue();
        SingleDependency(dependencies, "System.Text.Json").IsDirect.Should().BeFalse();
    }

    [Fact]
    public void ParseGradleLockfile_ReadsCoordinatesAndConfigurations()
    {
        const string content = """
        # This is a Gradle generated file for dependency locking.
        com.google.guava:guava:33.0.0-jre=compileClasspath
        org.junit.jupiter:junit-jupiter:5.10.2=testCompileClasspath
        empty=
        """;

        (List<Dependency> dependencies, _) = Parse("gradle.lockfile", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "com.google.guava:guava").CurrentVersion.Should().Be("33.0.0-jre");
        SingleDependency(dependencies, "org.junit.jupiter:junit-jupiter").Type.Should().Be(DependencyType.Dev);
    }

    [Fact]
    public void ParseGoMod_FlagsIndirectAsTransitiveAndReadsGoRuntime()
    {
        const string content = """
        module example.com/app

        go 1.22

        require (
        	github.com/gin-gonic/gin v1.9.1
        	golang.org/x/sys v0.18.0 // indirect
        )
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("go.mod", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "github.com/gin-gonic/gin").CurrentVersion.Should().Be("1.9.1");
        SingleDependency(dependencies, "github.com/gin-gonic/gin").IsDirect.Should().BeTrue();
        SingleDependency(dependencies, "golang.org/x/sys").IsDirect.Should().BeFalse();
        SingleRuntime(runtimes, "Go").Version.Should().Be("1.22");
    }

    [Fact]
    public void ParseComposerJson_ReadsPhpRuntimeAndFramework()
    {
        const string content = """
        {
          "require": { "php": "^8.2", "laravel/framework": "^11.0" },
          "require-dev": { "phpunit/phpunit": "^11.0" }
        }
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("composer.json", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "laravel/framework").Type.Should().Be(DependencyType.Prod);
        SingleDependency(dependencies, "phpunit/phpunit").Type.Should().Be(DependencyType.Dev);
        SingleRuntime(runtimes, "PHP").Version.Should().Be("8.2");
        SingleRuntime(runtimes, "Laravel").Version.Should().Be("11.0");
    }

    [Fact]
    public void ParseComposerLock_SeparatesPackagesFromDevPackages()
    {
        const string content = """
        {
          "packages": [ { "name": "laravel/framework", "version": "v11.0.7" } ],
          "packages-dev": [ { "name": "phpunit/phpunit", "version": "11.0.3" } ]
        }
        """;

        (List<Dependency> dependencies, _) = Parse("composer.lock", content);

        SingleDependency(dependencies, "laravel/framework").CurrentVersion.Should().Be("v11.0.7");
        SingleDependency(dependencies, "phpunit/phpunit").Type.Should().Be(DependencyType.Dev);
    }

    [Fact]
    public void ParseGemfile_ReadsRubyRuntimeAndGroups()
    {
        const string content = """
        source 'https://rubygems.org'
        ruby '3.3.0'

        gem 'rails', '~> 7.1.3'

        group :test do
          gem 'rspec', '3.13.0'
        end
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("Gemfile", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "rails").CurrentVersion.Should().Be("7.1.3");
        SingleDependency(dependencies, "rspec").Type.Should().Be(DependencyType.Dev);
        SingleRuntime(runtimes, "Ruby").Version.Should().Be("3.3.0");
        SingleRuntime(runtimes, "Rails").Version.Should().Be("7.1.3");
    }

    [Fact]
    public void ParseCargoToml_ReadsInlineTablesAndMinimumSupportedRustVersion()
    {
        const string content = """
        [package]
        name = "app"
        edition = "2021"
        rust-version = "1.76"

        [dependencies]
        serde = "1.0.197"
        tokio = { version = "1.36.0", features = ["full"] }

        [dev-dependencies]
        criterion = "0.5.1"
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("Cargo.toml", content);

        dependencies.Should().HaveCount(3);
        SingleDependency(dependencies, "tokio").CurrentVersion.Should().Be("1.36.0");
        SingleDependency(dependencies, "criterion").Type.Should().Be(DependencyType.Dev);
        SingleRuntime(runtimes, "Rust").Version.Should().Be("1.76");
    }

    [Fact]
    public void ParseCargoLock_KeepsRegistryPackagesOnly()
    {
        const string content = """
        [[package]]
        name = "serde"
        version = "1.0.197"
        source = "registry+https://github.com/rust-lang/crates.io-index"

        [[package]]
        name = "app"
        version = "0.1.0"
        """;

        (List<Dependency> dependencies, _) = Parse("Cargo.lock", content);

        dependencies.Should().ContainSingle();
        SingleDependency(dependencies, "serde").CurrentVersion.Should().Be("1.0.197");
    }

    [Fact]
    public void ParseCMakeLists_ReadsToolchainAndLanguageStandard()
    {
        const string content = """
        cmake_minimum_required(VERSION 3.20)
        project(app LANGUAGES C CXX)
        set(CMAKE_CXX_STANDARD 20)
        """;

        (_, List<Runtime> runtimes) = Parse("CMakeLists.txt", content);

        SingleRuntime(runtimes, "CMake").Version.Should().Be("3.20");
        SingleRuntime(runtimes, "C++").Version.Should().Be("20");
    }

    [Fact]
    public void ParseMixExs_ReadsElixirRuntimeAndDeps()
    {
        const string content = """
        defmodule App.MixProject do
          def project do
            [elixir: "~> 1.16"]
          end

          defp deps do
            [
              {:phoenix, "~> 1.7.11"},
              {:ecto_sql, "~> 3.11"}
            ]
          end
        end
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("mix.exs", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "phoenix").CurrentVersion.Should().Be("1.7.11");
        SingleRuntime(runtimes, "Elixir").Version.Should().Be("1.16");
    }

    [Fact]
    public void ParseMixLock_ReadsHexEntries()
    {
        const string content = """
        %{
          "phoenix": {:hex, :phoenix, "1.7.11", "abc", [:mix], [], "hexpm"},
          "ecto_sql": {:hex, :ecto_sql, "3.11.1", "def", [:mix], [], "hexpm"},
        }
        """;

        (List<Dependency> dependencies, _) = Parse("mix.lock", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "phoenix").CurrentVersion.Should().Be("1.7.11");
        dependencies.Should().OnlyContain(dependency => dependency.Ecosystem == DependencyEcosystem.Hex);
    }

    [Fact]
    public void ParsePubspecYaml_ReadsSdkConstraintsAndDependencies()
    {
        const string content = """
        name: app

        environment:
          sdk: '>=3.3.0 <4.0.0'
          flutter: '>=3.19.0'

        dependencies:
          http: ^1.2.0
          provider: ^6.1.2

        dev_dependencies:
          mocktail: ^1.0.3
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("pubspec.yaml", content);

        dependencies.Should().HaveCount(3);
        SingleDependency(dependencies, "http").CurrentVersion.Should().Be("1.2.0");
        SingleDependency(dependencies, "mocktail").Type.Should().Be(DependencyType.Dev);
        SingleRuntime(runtimes, "Dart").Version.Should().Be("3.3.0");
        SingleRuntime(runtimes, "Flutter").Version.Should().Be("3.19.0");
    }

    [Fact]
    public void ParsePubspecLock_KeepsHostedPackagesOnly()
    {
        const string content = """
        packages:
          http:
            dependency: "direct main"
            description:
              name: http
            source: hosted
            version: "1.2.0"
          local_package:
            dependency: "direct main"
            source: path
            version: "0.0.1"
        """;

        (List<Dependency> dependencies, _) = Parse("pubspec.lock", content);

        dependencies.Should().ContainSingle();
        SingleDependency(dependencies, "http").CurrentVersion.Should().Be("1.2.0");
    }

    [Fact]
    public void ParsePackageSwift_ReadsToolsVersion()
    {
        (_, List<Runtime> runtimes) = Parse("Package.swift", "// swift-tools-version:5.10");

        SingleRuntime(runtimes, "Swift").Version.Should().Be("5.10");
    }

    [Fact]
    public void ParsePackageResolved_NormalizesRepositoryUrls()
    {
        const string content = """
        {
          "pins": [
            {
              "identity": "alamofire",
              "location": "https://github.com/Alamofire/Alamofire.git",
              "state": { "version": "5.9.1" }
            }
          ],
          "version": 2
        }
        """;

        (List<Dependency> dependencies, _) = Parse("Package.resolved", content);

        dependencies.Should().ContainSingle();
        SingleDependency(dependencies, "github.com/Alamofire/Alamofire").CurrentVersion.Should().Be("5.9.1");
        dependencies.Should().OnlyContain(dependency => dependency.Ecosystem == DependencyEcosystem.Swift);
    }

    [Theory]
    [InlineData("net10.0", ".NET", "10.0")]
    [InlineData("net10.0-windows", ".NET", "10.0")]
    [InlineData("netcoreapp3.1", ".NET", "3.1")]
    [InlineData("net48", ".NET Framework", "4.8")]
    [InlineData("net472", ".NET Framework", "4.7.2")]
    public void ParseCsproj_MapsTargetFrameworkMonikerToRuntime(string moniker, string expectedName,
        string expectedVersion)
    {
        string content = $"""
        <Project Sdk="Microsoft.NET.Sdk">
          <PropertyGroup>
            <TargetFramework>{moniker}</TargetFramework>
          </PropertyGroup>
        </Project>
        """;

        (_, List<Runtime> runtimes) = Parse("App.csproj", content);

        SingleRuntime(runtimes, expectedName).Version.Should().Be(expectedVersion);
    }

    [Fact]
    public void ParseCsproj_MultiTargeting_KeepsEveryRuntimeAndIgnoresNetStandard()
    {
        const string content = """
        <Project Sdk="Microsoft.NET.Sdk">
          <PropertyGroup>
            <TargetFrameworks>netstandard2.0;net8.0;net10.0</TargetFrameworks>
          </PropertyGroup>
        </Project>
        """;

        (_, List<Runtime> runtimes) = Parse("App.fsproj", content);

        runtimes.Select(runtime => runtime.Version).Should().BeEquivalentTo("8.0", "10.0");
        runtimes.Should().OnlyContain(runtime => runtime.Name == ".NET");
    }

    [Fact]
    public void ParseDirectoryBuildProps_ReadsSharedTargetFramework()
    {
        const string content = """
        <Project>
          <PropertyGroup>
            <TargetFramework>net10.0</TargetFramework>
          </PropertyGroup>
        </Project>
        """;

        (_, List<Runtime> runtimes) = Parse("Directory.Build.props", content);

        SingleRuntime(runtimes, ".NET").Version.Should().Be("10.0");
    }

    [Fact]
    public void ParsePomXml_PrefersCompilerReleaseAndReadsSpringBootParent()
    {
        const string content = """
        <project xmlns="http://maven.apache.org/POM/4.0.0">
          <parent>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-parent</artifactId>
            <version>3.3.0</version>
          </parent>
          <properties>
            <maven.compiler.release>21</maven.compiler.release>
          </properties>
        </project>
        """;

        (_, List<Runtime> runtimes) = Parse("pom.xml", content);

        SingleRuntime(runtimes, "Java").Version.Should().Be("21");
        SingleRuntime(runtimes, "Spring Boot").Version.Should().Be("3.3.0");
    }

    [Theory]
    [InlineData("java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }", "21")]
    [InlineData("kotlin { jvmToolchain(17) }", "17")]
    [InlineData("sourceCompatibility = JavaVersion.VERSION_1_8", "8")]
    [InlineData("targetCompatibility = JavaVersion.VERSION_17", "17")]
    public void ParseBuildGradle_ReadsModernToolchainDeclarations(string declaration, string expectedVersion)
    {
        (_, List<Runtime> runtimes) = Parse("build.gradle.kts", declaration);

        SingleRuntime(runtimes, "Java").Version.Should().Be(expectedVersion);
    }

    [Fact]
    public void ParseBuildGradle_ReadsSpringBootPluginVersion()
    {
        const string content = """
        plugins {
            id("org.springframework.boot") version "3.3.1"
            id("org.jetbrains.kotlin.jvm") version "2.0.0"
        }
        """;

        (_, List<Runtime> runtimes) = Parse("build.gradle.kts", content);

        SingleRuntime(runtimes, "Spring Boot").Version.Should().Be("3.3.1");
        SingleRuntime(runtimes, "Kotlin").Version.Should().Be("2.0.0");
    }

    [Fact]
    public void ParsePackageJson_KeepsEveryDetectedFramework()
    {
        const string content = """
        {
          "dependencies": { "react": "^19.0.0", "express": "4.19.2" }
        }
        """;

        (_, List<Runtime> runtimes) = Parse("package.json", content);

        SingleRuntime(runtimes, "React").Version.Should().Be("19.0.0");
        SingleRuntime(runtimes, "Express").Version.Should().Be("4.19.2");
    }

    [Fact]
    public void ParseComposerJson_DetectsSymfonyThroughFrameworkBundle()
    {
        const string content = """
        {
          "require": { "php": "^8.3", "symfony/framework-bundle": "^7.1" }
        }
        """;

        (_, List<Runtime> runtimes) = Parse("composer.json", content);

        SingleRuntime(runtimes, "PHP").Version.Should().Be("8.3");
        SingleRuntime(runtimes, "Symfony").Version.Should().Be("7.1");
    }

    [Theory]
    [InlineData(".nvmrc", "v20.11.0", "Node.js", "20.11.0")]
    [InlineData(".node-version", "22", "Node.js", "22")]
    [InlineData(".python-version", "3.12.1", "Python", "3.12.1")]
    [InlineData(".ruby-version", "ruby-3.3.0", "Ruby", "3.3.0")]
    [InlineData(".java-version", "temurin-21.0.2", "Java", "21.0.2")]
    [InlineData(".go-version", "1.22.5", "Go", "1.22.5")]
    public void ParseVersionFile_ReadsDeclaredRuntime(string fileName, string content, string expectedName,
        string expectedVersion)
    {
        (_, List<Runtime> runtimes) = Parse(fileName, content);

        SingleRuntime(runtimes, expectedName).Version.Should().Be(expectedVersion);
    }

    [Fact]
    public void ParseVersionFile_IgnoresNonNumericAliases()
    {
        (_, List<Runtime> runtimes) = Parse(".nvmrc", "lts/hydrogen");

        runtimes.Should().BeEmpty();
    }

    [Fact]
    public void ParseToolVersions_ReadsEveryKnownTool()
    {
        const string content = """
        # asdf
        nodejs 20.11.0
        python 3.12.1
        java temurin-21.0.2
        terraform 1.7.0
        """;

        (_, List<Runtime> runtimes) = Parse(".tool-versions", content);

        runtimes.Should().HaveCount(3);
        SingleRuntime(runtimes, "Node.js").Version.Should().Be("20.11.0");
        SingleRuntime(runtimes, "Java").Version.Should().Be("21.0.2");
    }

    [Fact]
    public void ParseGlobalJson_ReadsSdkBand()
    {
        (_, List<Runtime> runtimes) = Parse("global.json", """{ "sdk": { "version": "10.0.100" } }""");

        SingleRuntime(runtimes, ".NET").Version.Should().Be("10.0");
    }

    [Fact]
    public void ParseGoWork_ReadsWorkspaceGoVersion()
    {
        const string content = """
        go 1.22

        use ./service
        """;

        (_, List<Runtime> runtimes) = Parse("go.work", content);

        SingleRuntime(runtimes, "Go").Version.Should().Be("1.22");
    }

    [Fact]
    public void ParseRuntimeTxt_ReadsPlatformDeclaration()
    {
        (_, List<Runtime> runtimes) = Parse("runtime.txt", "python-3.11.6");

        SingleRuntime(runtimes, "Python").Version.Should().Be("3.11.6");
    }

    [Theory]
    [InlineData("channel = \"1.76.0\"", "1.76.0")]
    [InlineData("1.75.0", "1.75.0")]
    public void ParseRustToolchain_ReadsPinnedChannel(string content, string expectedVersion)
    {
        (_, List<Runtime> runtimes) = Parse("rust-toolchain.toml", content);

        SingleRuntime(runtimes, "Rust").Version.Should().Be(expectedVersion);
    }

    [Fact]
    public void ParseRustToolchain_IgnoresRollingChannels()
    {
        (_, List<Runtime> runtimes) = Parse("rust-toolchain", "stable");

        runtimes.Should().BeEmpty();
    }

    [Fact]
    public void ParseDockerfile_ReadsKnownBaseImagesAcrossStages()
    {
        const string content = """
        FROM node:20-alpine AS build
        FROM mcr.microsoft.com/dotnet/aspnet:10.0
        FROM nginx:latest
        FROM python:alpine
        """;

        (_, List<Runtime> runtimes) = Parse("Dockerfile", content);

        runtimes.Should().HaveCount(2);
        SingleRuntime(runtimes, "Node.js").Version.Should().Be("20");
        SingleRuntime(runtimes, ".NET").Version.Should().Be("10.0");
    }

    [Theory]
    [InlineData("package.json", "{ not json")]
    [InlineData("package-lock.json", "")]
    [InlineData("pom.xml", "<project>")]
    [InlineData("Sentinel.API.csproj", "<Project")]
    [InlineData("composer.json", "null")]
    [InlineData("Package.resolved", "[]")]
    public void Parse_MalformedContent_YieldsNothingWithoutThrowing(string fileName, string content)
    {
        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse(fileName, content);

        dependencies.Should().BeEmpty();
        runtimes.Should().BeEmpty();
    }

    [Fact]
    public void ParseReportingFailure_MalformedContent_ExposesTheFailure()
    {
        ManifestParseOutcome outcome = new ManifestParserService()
            .ParseReportingFailure(ProjectId, "package.json", "{ not json");

        outcome.Failure.Should().NotBeNull();
        outcome.Dependencies.Should().BeEmpty();
    }

    [Fact]
    public void ParseReportingFailure_ValidContent_ReportsNoFailure()
    {
        ManifestParseOutcome outcome = new ManifestParserService()
            .ParseReportingFailure(ProjectId, "package.json", """{ "dependencies": { "axios": "1.6.0" } }""");

        outcome.Failure.Should().BeNull();
        outcome.Dependencies.Should().ContainSingle();
    }

    [Fact]
    public void ParseGemfileLock_ReadsLockedGemsAndDirectness()
    {
        const string content = """
        GEM
          remote: https://rubygems.org/
          specs:
            nokogiri (1.16.2-x86_64-linux)
              racc (~> 1.4)
            racc (1.7.3)
            rails (7.1.3)

        PLATFORMS
          x86_64-linux

        DEPENDENCIES
          nokogiri
          rails (~> 7.1)
        """;

        (List<Dependency> dependencies, _) = Parse("Gemfile.lock", content);

        dependencies.Should().HaveCount(3);
        SingleDependency(dependencies, "nokogiri").CurrentVersion.Should().Be("1.16.2");
        SingleDependency(dependencies, "racc").IsDirect.Should().BeFalse();
        SingleDependency(dependencies, "rails").IsDirect.Should().BeTrue();
    }

    [Fact]
    public void ParseUvLock_SkipsTheLocalProject()
    {
        const string content = """
        [[package]]
        name = "app"
        version = "0.1.0"
        source = { editable = "." }

        [[package]]
        name = "httpx"
        version = "0.27.0"
        source = { registry = "https://pypi.org/simple" }
        """;

        (List<Dependency> dependencies, _) = Parse("uv.lock", content);

        SingleDependency(dependencies, "httpx").CurrentVersion.Should().Be("0.27.0");
        dependencies.Should().ContainSingle();
    }

    [Fact]
    public void ParseBunLock_ReadsPackagesWithTrailingCommas()
    {
        const string content = """
        {
          "lockfileVersion": 1,
          "packages": {
            "react": ["react@19.0.0", "", {}, "sha512-x"],
            "@types/node": ["@types/node@22.10.2", "", {}, "sha512-y"],
            "app": ["app@workspace:packages/app"],
          },
        }
        """;

        (List<Dependency> dependencies, _) = Parse("bun.lock", content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "@types/node").CurrentVersion.Should().Be("22.10.2");
    }

    [Fact]
    public void ParsePackagesConfig_ReadsNuGetPackages()
    {
        const string content = """
        <?xml version="1.0" encoding="utf-8"?>
        <packages>
          <package id="Newtonsoft.Json" version="13.0.1" targetFramework="net48" />
          <package id="NUnit" version="3.14.0" targetFramework="net48" developmentDependency="true" />
        </packages>
        """;

        (List<Dependency> dependencies, _) = Parse("packages.config", content);

        SingleDependency(dependencies, "Newtonsoft.Json").Ecosystem.Should().Be(DependencyEcosystem.NuGet);
        SingleDependency(dependencies, "NUnit").Type.Should().Be(DependencyType.Dev);
    }

    [Fact]
    public void ParsePodfileLock_ReadsPodsAndDirectness()
    {
        const string content = """
        PODS:
          - Alamofire (5.8.1)
          - Firebase/Core (10.20.0):
            - FirebaseCore (= 10.20.0)
          - FirebaseCore (10.20.0)

        DEPENDENCIES:
          - Alamofire (~> 5.8)
          - Firebase/Core

        COCOAPODS: 1.15.2
        """;

        (List<Dependency> dependencies, _) = Parse("Podfile.lock", content);

        dependencies.Should().HaveCount(3);
        SingleDependency(dependencies, "Alamofire").Ecosystem.Should().Be(DependencyEcosystem.CocoaPods);
        SingleDependency(dependencies, "Firebase").IsDirect.Should().BeTrue();
        SingleDependency(dependencies, "FirebaseCore").IsDirect.Should().BeFalse();
    }

    [Fact]
    public void ParseWorkflow_ReadsVersionedActionsOnly()
    {
        const string content = """
        jobs:
          build:
            steps:
              - uses: actions/checkout@v4
              - uses: github/codeql-action/init@v3.25.1
              - uses: ./local-action
              - uses: docker://alpine:3.19
              - uses: actions/setup-node@8f152de45cc393bb48ce5d89d36b731f54556e65
        """;

        (List<Dependency> dependencies, _) = Parse(ManifestParserService.WorkflowFileName, content);

        dependencies.Should().HaveCount(2);
        SingleDependency(dependencies, "actions/checkout").IsVersionPinned.Should().BeFalse();
        SingleDependency(dependencies, "github/codeql-action").CurrentVersion.Should().Be("3.25.1");
        SingleDependency(dependencies, "github/codeql-action").Ecosystem.Should().Be(DependencyEcosystem.GitHubActions);
    }

    [Theory]
    [InlineData("https://raw.githubusercontent.com/acme/app/HEAD/.github/workflows/ci.yml", true)]
    [InlineData("https://gitlab.com/api/v4/projects/1/repository/files/.github%2Fworkflows%2Fci.yaml/raw?ref=HEAD", true)]
    [InlineData("https://raw.githubusercontent.com/acme/app/HEAD/config/ci.yml", false)]
    public void IsWorkflowFile_DetectsGitHubWorkflows(string url, bool expected)
    {
        ManifestParserService.IsWorkflowFile(url).Should().Be(expected);
    }

    [Fact]
    public void ParsePackageJson_SkipsNonRegistrySpecsAndFlagsRanges()
    {
        const string content = """
        {
          "engines": { "node": ">=14" },
          "dependencies": {
            "axios": "1.6.8",
            "lodash": "^4.17.21",
            "shared": "workspace:*",
            "local": "file:../local",
            "forked": "github:acme/forked",
            "aliased": "npm:react@18.2.0"
          }
        }
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("package.json", content);

        dependencies.Select(dependency => dependency.Name).Should().BeEquivalentTo(["axios", "lodash", "react"]);
        SingleDependency(dependencies, "axios").IsVersionPinned.Should().BeTrue();
        SingleDependency(dependencies, "lodash").IsVersionPinned.Should().BeFalse();
        SingleDependency(dependencies, "react").CurrentVersion.Should().Be("18.2.0");
        SingleRuntime(runtimes, "Node.js").IsMinimumConstraint.Should().BeTrue();
    }

    [Fact]
    public void ParsePyprojectToml_ReadsPoetryGroupsInlineTablesAndExtras()
    {
        const string content = """
        [tool.poetry.dependencies]
        python = "^3.10"
        devtools = "1.0.0"
        uvicorn = { version = "0.29.0", extras = ["standard"] }

        [tool.poetry.group.dev.dependencies]
        pytest = "^8.0"

        [project]
        name = "app"
        requires-python = ">=3.10"
        dependencies = ["uvicorn[standard] >= 0.29", "requests==2.31.0"]
        """;

        (List<Dependency> dependencies, List<Runtime> runtimes) = Parse("pyproject.toml", content);

        dependencies.Single(d => d.Name == "devtools").Type.Should().Be(DependencyType.Prod);
        dependencies.First(d => d.Name == "uvicorn").CurrentVersion.Should().Be("0.29.0");
        dependencies.Single(d => d.Name == "pytest").Type.Should().Be(DependencyType.Dev);
        dependencies.Single(d => d.Name == "requests").IsVersionPinned.Should().BeTrue();
        dependencies.Last(d => d.Name == "uvicorn").IsVersionPinned.Should().BeFalse();
        runtimes.Single(r => r.Name == "Python").IsMinimumConstraint.Should().BeTrue();
    }

    [Fact]
    public void ParseGemfile_KeepsDevGroupAcrossKeywordBlocks()
    {
        const string content = """
        group :development do
          if RUBY_PLATFORM =~ /darwin/
            gem "terminal-notifier"
          end
          gem "listen"
        end
        gem "pg"
        """;

        (List<Dependency> dependencies, _) = Parse("Gemfile", content);

        SingleDependency(dependencies, "terminal-notifier").Type.Should().Be(DependencyType.Dev);
        SingleDependency(dependencies, "listen").Type.Should().Be(DependencyType.Dev);
        SingleDependency(dependencies, "pg").Type.Should().Be(DependencyType.Prod);
    }

    [Fact]
    public void ParseGemfile_TracksGroupsAcrossNestedBlocks()
    {
        const string content = """
        source "https://rubygems.org"

        gem "rails", "7.1.3"

        platforms :jruby do
          gem "jruby-openssl"
        end

        group :development, :test do
          gem "rspec", "~> 3.13"
          if ENV["CI"] do
            gem "simplecov"
          end
          gem "rubocop"
        end

        gem "puma", group: :development
        gem "pg"
        """;

        (List<Dependency> dependencies, _) = Parse("Gemfile", content);

        SingleDependency(dependencies, "rails").IsVersionPinned.Should().BeTrue();
        SingleDependency(dependencies, "jruby-openssl").Type.Should().Be(DependencyType.Prod);
        SingleDependency(dependencies, "rspec").Type.Should().Be(DependencyType.Dev);
        SingleDependency(dependencies, "rubocop").Type.Should().Be(DependencyType.Dev);
        SingleDependency(dependencies, "puma").Type.Should().Be(DependencyType.Dev);
        SingleDependency(dependencies, "pg").Type.Should().Be(DependencyType.Prod);
    }

    [Fact]
    public void ParsePomXml_IgnoresManagedAndPluginDependencies()
    {
        const string content = """
        <project xmlns="http://maven.apache.org/POM/4.0.0">
          <dependencyManagement>
            <dependencies>
              <dependency><groupId>org.managed</groupId><artifactId>bom</artifactId><version>1.0</version></dependency>
            </dependencies>
          </dependencyManagement>
          <dependencies>
            <dependency><groupId>org.app</groupId><artifactId>core</artifactId><version>2.0</version></dependency>
          </dependencies>
          <build>
            <plugins>
              <plugin>
                <artifactId>maven-plugin</artifactId>
                <dependencies>
                  <dependency><groupId>org.plugin</groupId><artifactId>helper</artifactId><version>3.0</version></dependency>
                </dependencies>
              </plugin>
            </plugins>
          </build>
        </project>
        """;

        (List<Dependency> dependencies, _) = Parse("pom.xml", content);

        dependencies.Should().ContainSingle().Which.Name.Should().Be("org.app:core");
    }

    [Fact]
    public void ParseCsproj_SkipsUnresolvedPropertiesAndReadsVersionOverride()
    {
        const string content = """
        <Project Sdk="Microsoft.NET.Sdk">
          <ItemGroup>
            <PackageReference Include="Serilog" Version="$(SerilogVersion)" />
            <PackageReference Include="Polly" VersionOverride="8.4.0" />
          </ItemGroup>
        </Project>
        """;

        (List<Dependency> dependencies, _) = Parse("App.csproj", content);

        dependencies.Should().ContainSingle().Which.CurrentVersion.Should().Be("8.4.0");
    }

    [Fact]
    public void ParseDockerfile_HandlesPlatformFlagsAndRegistryPrefixes()
    {
        const string content = """
        FROM --platform=$BUILDPLATFORM node:20-alpine AS build
        FROM docker.io/library/python:3.12-slim
        """;

        (_, List<Runtime> runtimes) = Parse("Dockerfile", content);

        SingleRuntime(runtimes, "Node.js").Version.Should().Be("20");
        SingleRuntime(runtimes, "Python").Version.Should().Be("3.12");
    }

    [Fact]
    public void ParseDockerfile_DetectsBaseOperatingSystems()
    {
        const string content = """
        FROM node:20-alpine3.19 AS build
        FROM python:3.12-slim-bookworm AS tools
        FROM ubuntu:jammy
        FROM debian:12-slim
        """;

        (_, List<Runtime> runtimes) = Parse("Dockerfile", content);

        SingleRuntime(runtimes, "Alpine Linux").Version.Should().Be("3.19");
        SingleRuntime(runtimes, "Ubuntu").Version.Should().Be("22.04");
        runtimes.Where(runtime => runtime.Name == "Debian").Select(runtime => runtime.Version)
            .Should().BeEquivalentTo(["12", "12"]);
    }

    [Fact]
    public void ParseGradleWrapperProperties_ReadsTheGradleVersion()
    {
        const string content = "distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip";

        (_, List<Runtime> runtimes) = Parse("gradle-wrapper.properties", content);

        SingleRuntime(runtimes, "Gradle").Version.Should().Be("8.5");
    }

    [Fact]
    public void ParsePomXml_DerivesTheSpringFrameworkRuntime()
    {
        const string content = """
        <project>
          <dependencies>
            <dependency><groupId>org.springframework</groupId><artifactId>spring-core</artifactId><version>5.3.39</version></dependency>
          </dependencies>
        </project>
        """;

        (_, List<Runtime> runtimes) = Parse("pom.xml", content);

        SingleRuntime(runtimes, "Spring Framework").Version.Should().Be("5.3.39");
    }
}
