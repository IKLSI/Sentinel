using FluentAssertions;
using Sentinel.Application.Security;
using Sentinel.Application.TechHealth;
using Sentinel.Application.TechHealth.Scan;

namespace Sentinel.Tests.Services;

public class ManifestPatcherServiceTests
{
    private readonly ManifestPatcherService _sut = new();

    [Fact]
    public void TryPatch_PackageJson_ReplacesVersionPreservingCaret()
    {
        string content = "{\n  \"dependencies\": {\n    \"lodash\": \"^4.17.10\",\n    \"axios\": \"^1.0.0\"\n  }\n}";

        bool changed = _sut.TryPatch("package.json", content, "lodash", "4.17.21", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("\"lodash\": \"^4.17.21\"");
        patched.Should().Contain("\"axios\": \"^1.0.0\"");
    }

    [Fact]
    public void TryPatch_Csproj_AttributeForm_ReplacesVersion()
    {
        string content = "<Project>\n  <ItemGroup>\n    <PackageReference Include=\"Newtonsoft.Json\" Version=\"12.0.1\" />\n  </ItemGroup>\n</Project>";

        bool changed = _sut.TryPatch("App.csproj", content, "Newtonsoft.Json", "13.0.3", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("Version=\"13.0.3\"");
    }

    [Fact]
    public void TryPatch_RequirementsTxt_ReplacesPinnedVersion()
    {
        string content = "django==3.2.0\nrequests==2.20.0\n";

        bool changed = _sut.TryPatch("requirements.txt", content, "django", "3.2.20", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("django==3.2.20");
        patched.Should().Contain("requests==2.20.0");
    }

    [Fact]
    public void TryPatch_GoMod_ReplacesVersionKeepingVPrefix()
    {
        string content = "module example\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.6.0\n)\n";

        bool changed = _sut.TryPatch("go.mod", content, "github.com/gin-gonic/gin", "1.9.1", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("github.com/gin-gonic/gin v1.9.1");
    }

    [Fact]
    public void TryPatch_CargoToml_ReplacesTableVersion()
    {
        string content = "[dependencies]\nserde = \"1.0.100\"\ntokio = \"1.0.0\"\n";

        bool changed = _sut.TryPatch("Cargo.toml", content, "serde", "1.0.200", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("serde = \"1.0.200\"");
    }

    [Fact]
    public void TryPatch_PomXml_ReplacesDependencyVersion()
    {
        string content = "<dependencies><dependency><groupId>org.apache.commons</groupId><artifactId>commons-lang3</artifactId><version>3.9</version></dependency></dependencies>";

        bool changed = _sut.TryPatch("pom.xml", content, "org.apache.commons:commons-lang3", "3.12.0", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("<version>3.12.0</version>");
    }

    [Fact]
    public void TryPatch_TransitiveDep_AddsOverridesBlock()
    {
        string content = "{\n  \"name\": \"app\",\n  \"dependencies\": {\n    \"axios\": \"^1.0.0\"\n  }\n}";

        bool changed = _sut.TryPatch("package.json", content, "lodash", "4.17.21", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("\"overrides\"");
        patched.Should().Contain("\"lodash\": \"4.17.21\"");
        patched.Should().Contain("\"axios\": \"^1.0.0\"");
    }

    [Fact]
    public void TryPatch_TransitiveDep_ExistingOverrides_AddsEntry()
    {
        string content = "{\n  \"overrides\": {\n    \"minimist\": \"1.2.6\"\n  },\n  \"dependencies\": {\n    \"axios\": \"^1.0.0\"\n  }\n}";

        bool changed = _sut.TryPatch("package.json", content, "lodash", "4.17.21", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("\"lodash\": \"4.17.21\"");
        patched.Should().Contain("\"minimist\": \"1.2.6\"");
    }

    [Fact]
    public void TryPatch_TransitiveDep_ExistingOverrideSameName_UpdatesVersion()
    {
        string content = "{\n  \"overrides\": {\n    \"lodash\": \"4.17.10\"\n  }\n}";

        bool changed = _sut.TryPatch("package.json", content, "lodash", "4.17.21", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("\"lodash\": \"4.17.21\"");
        patched.Should().NotContain("4.17.10");
    }

    [Fact]
    public void TryPatch_DirectDep_DoesNotAddOverrides()
    {
        string content = "{\n  \"dependencies\": {\n    \"lodash\": \"^4.17.10\"\n  }\n}";

        bool changed = _sut.TryPatch("package.json", content, "lodash", "4.17.21", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("\"lodash\": \"^4.17.21\"");
        patched.Should().NotContain("overrides");
    }

    [Fact]
    public void TryPatch_NodeEngineNotMatched_AddsOverrideInstead()
    {
        string content = "{\n  \"engines\": {\n    \"node\": \"18.0.0\"\n  },\n  \"dependencies\": {\n    \"axios\": \"^1.0.0\"\n  }\n}";

        bool changed = _sut.TryPatch("package.json", content, "node", "20.0.0", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("\"engines\"");
        patched.Should().Contain("\"node\": \"18.0.0\"");
        patched.Should().Contain("\"overrides\"");
    }

    [Fact]
    public void TryPatch_SameVersion_NoChange()
    {
        string content = "{\n  \"dependencies\": {\n    \"lodash\": \"4.17.21\"\n  }\n}";

        bool changed = _sut.TryPatch("package.json", content, "lodash", "4.17.21", out string patched);

        changed.Should().BeFalse();
    }

    [Fact]
    public void TryPatch_EmptyOverridesObject_NoTrailingComma()
    {
        string content = "{\n  \"overrides\": {},\n  \"dependencies\": {\n    \"axios\": \"^1.0.0\"\n  }\n}";

        bool changed = _sut.TryPatch("package.json", content, "lodash", "4.17.21", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("\"lodash\": \"4.17.21\"");
        Action parse = () => System.Text.Json.JsonDocument.Parse(patched);
        parse.Should().NotThrow();
    }

    [Fact]
    public void TryPatch_ProducesValidJson_ForNewOverridesBlock()
    {
        string content = "{\n  \"name\": \"app\",\n  \"dependencies\": {\n    \"axios\": \"^1.0.0\"\n  }\n}";

        _sut.TryPatch("package.json", content, "lodash", "4.17.21", out string patched);

        Action parse = () => System.Text.Json.JsonDocument.Parse(patched);
        parse.Should().NotThrow();
    }

    [Fact]
    public void IsPatchable_KnownManifests_ReturnsTrue()
    {
        ManifestPatcherService.IsPatchable("package.json").Should().BeTrue();
        ManifestPatcherService.IsPatchable("App.csproj").Should().BeTrue();
        ManifestPatcherService.IsPatchable("go.mod").Should().BeTrue();
    }

    [Fact]
    public void IsPatchable_LockFile_ReturnsFalse()
    {
        ManifestPatcherService.IsPatchable("package-lock.json").Should().BeFalse();
        ManifestPatcherService.IsPatchable("Cargo.lock").Should().BeFalse();
    }

    [Fact]
    public void TryPatch_PackageSwift_FromForm_ReplacesVersion()
    {
        string content = ".package(url: \"https://github.com/apple/swift-nio.git\", from: \"2.0.0\")";

        bool changed = _sut.TryPatch("Package.swift", content, "github.com/apple/swift-nio", "2.9.0", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("from: \"2.9.0\"");
    }

    [Fact]
    public void TryPatch_PackageSwift_ExactForm_ReplacesVersion()
    {
        string content = ".package(url: \"https://github.com/apple/swift-log.git\", exact: \"1.0.0\")";

        bool changed = _sut.TryPatch("Package.swift", content, "github.com/apple/swift-log", "1.5.4", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("exact: \"1.5.4\"");
    }

    [Fact]
    public void TryPatch_DirectoryPackagesProps_ReplacesVersion()
    {
        string content = "<Project>\n  <ItemGroup>\n    <PackageVersion Include=\"Newtonsoft.Json\" Version=\"12.0.1\" />\n  </ItemGroup>\n</Project>";

        bool changed = _sut.TryPatch("Directory.Packages.props", content, "Newtonsoft.Json", "13.0.3", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("Version=\"13.0.3\"");
    }

    [Fact]
    public void TryPatch_PackagesConfig_ReplacesVersion()
    {
        string content = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<packages>\n  <package id=\"Newtonsoft.Json\" version=\"12.0.1\" targetFramework=\"net48\" />\n</packages>";

        bool changed = _sut.TryPatch("packages.config", content, "Newtonsoft.Json", "13.0.3", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("version=\"13.0.3\"");
    }

    [Fact]
    public void TryPatch_GradleCatalog_InlineModuleVersion_ReplacesVersion()
    {
        string content = "[libraries]\ngson = { module = \"com.google.code.gson:gson\", version = \"2.8.0\" }\n";

        bool changed = _sut.TryPatch("libs.versions.toml", content, "com.google.code.gson:gson", "2.10.1", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("version = \"2.10.1\"");
    }

    [Fact]
    public void TryPatch_GradleCatalog_GroupNameVersion_ReplacesVersion()
    {
        string content = "[libraries]\ngson = { group = \"com.google.code.gson\", name = \"gson\", version = \"2.8.0\" }\n";

        bool changed = _sut.TryPatch("libs.versions.toml", content, "com.google.code.gson:gson", "2.10.1", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("version = \"2.10.1\"");
    }

    [Fact]
    public void TryPatch_GradleCatalog_VersionRef_ReplacesVersionsTable()
    {
        string content = "[versions]\ngson = \"2.8.0\"\n\n[libraries]\ngson-lib = { module = \"com.google.code.gson:gson\", version.ref = \"gson\" }\n";

        bool changed = _sut.TryPatch("libs.versions.toml", content, "com.google.code.gson:gson", "2.10.1", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("gson = \"2.10.1\"");
    }

    [Fact]
    public void TryPatch_PyprojectPep621_ArrayDependency_ReplacesVersion()
    {
        string content = "[project]\ndependencies = [\n    \"django>=3.2.0\",\n    \"requests\",\n]\n";

        bool changed = _sut.TryPatch("pyproject.toml", content, "django", "3.2.20", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("\"django>=3.2.20\"");
        patched.Should().Contain("\"requests\"");
    }

    [Fact]
    public void TryPatch_Pipfile_ReplacesPinnedVersion()
    {
        string content = "[packages]\ndjango = \"==3.2.0\"\nrequests = \"*\"\n";

        bool changed = _sut.TryPatch("Pipfile", content, "django", "3.2.20", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("django = \"==3.2.20\"");
    }

    [Fact]
    public void TryPatch_PomXml_PropertyVersion_ReplacesPropertyValue()
    {
        string content = "<project>\n  <properties>\n    <commons.version>3.9</commons.version>\n  </properties>\n  <dependencies>\n    <dependency>\n      <groupId>org.apache.commons</groupId>\n      <artifactId>commons-lang3</artifactId>\n      <version>${commons.version}</version>\n    </dependency>\n  </dependencies>\n</project>";

        bool changed = _sut.TryPatch("pom.xml", content, "org.apache.commons:commons-lang3", "3.12.0", out string patched);

        changed.Should().BeTrue();
        patched.Should().Contain("<commons.version>3.12.0</commons.version>");
    }

    [Fact]
    public void IsStructurallyValid_ValidJson_ReturnsTrue()
    {
        ManifestPatcherService.IsStructurallyValid("package.json", "{ \"name\": \"app\" }", "{ \"name\": \"app\" }").Should().BeTrue();
    }

    [Fact]
    public void IsStructurallyValid_BrokenJson_ReturnsFalse()
    {
        ManifestPatcherService.IsStructurallyValid("package.json", "{}", "{ \"name\": ").Should().BeFalse();
    }

    [Fact]
    public void IsStructurallyValid_BrokenXml_ReturnsFalse()
    {
        ManifestPatcherService.IsStructurallyValid("App.csproj", "<Project></Project>", "<Project>").Should().BeFalse();
    }

    [Fact]
    public void IsStructurallyValid_Toml_VersionSwapPreservesDelimiters_ReturnsTrue()
    {
        string original = "[dependencies]\nserde = \"1.0.100\"\n";
        string patched = "[dependencies]\nserde = \"1.0.200\"\n";

        ManifestPatcherService.IsStructurallyValid("Cargo.toml", original, patched).Should().BeTrue();
    }

    [Fact]
    public void IsStructurallyValid_Toml_BrokenQuote_ReturnsFalse()
    {
        string original = "[dependencies]\nserde = \"1.0.100\"\n";
        string patched = "[dependencies]\nserde = \"1.0.200\n";

        ManifestPatcherService.IsStructurallyValid("Cargo.toml", original, patched).Should().BeFalse();
    }

    [Fact]
    public void IsStructurallyValid_Requirements_VersionSwap_ReturnsTrue()
    {
        ManifestPatcherService.IsStructurallyValid("requirements.txt", "django==3.2.0\n", "django==3.2.20\n").Should().BeTrue();
    }

    [Fact]
    public void IsPatchable_NewManifests_ReturnsTrue()
    {
        ManifestPatcherService.IsPatchable("Package.swift").Should().BeTrue();
        ManifestPatcherService.IsPatchable("Directory.Packages.props").Should().BeTrue();
        ManifestPatcherService.IsPatchable("packages.config").Should().BeTrue();
        ManifestPatcherService.IsPatchable("libs.versions.toml").Should().BeTrue();
        ManifestPatcherService.IsPatchable("Pipfile").Should().BeTrue();
    }
}
