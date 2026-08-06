using FluentAssertions;
using Sentinel.Infrastructure.Http;

namespace Sentinel.Tests.Services;

public class EndOfLifeCatalogTests
{
    private static EndOfLifeCycle Cycle(string cycle) => new EndOfLifeCycle(cycle, null, null);

    [Theory]
    [InlineData("Node.js", "nodejs")]
    [InlineData(".NET", "dotnet")]
    [InlineData(".NET Framework", "dotnetfx")]
    [InlineData("Java", "eclipse-temurin")]
    [InlineData("Spring Boot", "spring-boot")]
    [InlineData("Next.js", "nextjs")]
    public void ResolveProduct_MapsKnownRuntimesToEndOfLifeSlugs(string runtimeName, string expectedProduct)
    {
        EndOfLifeCatalog.ResolveProduct(runtimeName).Should().Be(expectedProduct);
    }

    [Theory]
    [InlineData("NestJS")]
    [InlineData("Flutter")]
    [InlineData("CMake")]
    [InlineData("C++")]
    public void ResolveProduct_ReturnsNullForRuntimesWithoutPublicLifecycleData(string runtimeName)
    {
        EndOfLifeCatalog.ResolveProduct(runtimeName).Should().BeNull();
    }

    [Theory]
    [InlineData("Java", "1.8", "8")]
    [InlineData("Java", "1.8.0_402", "8")]
    [InlineData("Java", "21", "21")]
    [InlineData("Node.js", "v20.11.0", "20.11.0")]
    [InlineData(".NET", "10.0", "10.0")]
    [InlineData("Python", "3.12.1rc1", "3.12")]
    public void NormalizeVersion_KeepsComparableNumericSegments(string runtimeName, string version, string expected)
    {
        EndOfLifeCatalog.NormalizeVersion(runtimeName, version).Should().Be(expected);
    }

    [Theory]
    [InlineData("unknown")]
    [InlineData("")]
    [InlineData("stable")]
    public void NormalizeVersion_RejectsNonNumericDeclarations(string version)
    {
        EndOfLifeCatalog.NormalizeVersion("Rust", version).Should().BeNull();
    }

    [Theory]
    [InlineData("10.0", "10")]
    [InlineData("8.0.404", "8")]
    public void SelectCycle_MatchesMajorOnlyProducts(string version, string expectedCycle)
    {
        EndOfLifeCycle[] cycles = [Cycle("10"), Cycle("9"), Cycle("8")];

        EndOfLifeCatalog.SelectCycle(cycles, version)!.Cycle.Should().Be(expectedCycle);
    }

    [Theory]
    [InlineData("3.5.13", "3.5")]
    [InlineData("3.4", "3.4")]
    public void SelectCycle_MatchesMajorMinorProducts(string version, string expectedCycle)
    {
        EndOfLifeCycle[] cycles = [Cycle("3.5"), Cycle("3.4"), Cycle("2.7")];

        EndOfLifeCatalog.SelectCycle(cycles, version)!.Cycle.Should().Be(expectedCycle);
    }

    [Fact]
    public void SelectCycle_PrefersTheMostSpecificCycle()
    {
        EndOfLifeCycle[] cycles = [Cycle("4.8.1"), Cycle("4.8"), Cycle("4.7.2")];

        EndOfLifeCatalog.SelectCycle(cycles, "4.8.1")!.Cycle.Should().Be("4.8.1");
    }

    [Fact]
    public void SelectCycle_FallsBackToLatestChildCycleWhenVersionIsLessPrecise()
    {
        EndOfLifeCycle[] cycles = [Cycle("3.4"), Cycle("3.10"), Cycle("3.5"), Cycle("2.7")];

        EndOfLifeCatalog.SelectCycle(cycles, "3")!.Cycle.Should().Be("3.10");
    }

    [Fact]
    public void SelectCycle_ReturnsNullWhenNothingMatches()
    {
        EndOfLifeCycle[] cycles = [Cycle("21"), Cycle("17")];

        EndOfLifeCatalog.SelectCycle(cycles, "42").Should().BeNull();
    }
}
