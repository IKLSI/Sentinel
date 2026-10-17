using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Sentinel.API.Extensions;

namespace Sentinel.Tests.Configuration;

public class SettingsValidationTests
{
    private sealed class StubEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "Sentinel.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private static Dictionary<string, string?> CompleteConfiguration() => new()
    {
        ["Jwt:Secret"] = "une-cle-de-test-suffisamment-longue-1234567890",
        ["Email:Host"] = "smtp.example.fr",
        ["Email:FromAddress"] = "no-reply@example.fr",
        ["Frontend:BaseUrl"] = "https://sentinel.example.fr",
        ["Support:Email"] = "support@example.fr"
    };

    private static IReadOnlyList<string> ValidationFailures(string environmentName, Dictionary<string, string?> values)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();

        ServiceCollection services = new ServiceCollection();
        services.AddSettings(configuration, new StubEnvironment { EnvironmentName = environmentName });

        IStartupValidator validator = services.BuildServiceProvider().GetRequiredService<IStartupValidator>();

        try
        {
            validator.Validate();
            return [];
        }
        catch (AggregateException aggregate)
        {
            return aggregate.InnerExceptions.Select(exception => exception.Message).ToList();
        }
        catch (OptionsValidationException exception)
        {
            return [exception.Message];
        }
    }

    [Fact]
    public void Production_WithEmptyConfiguration_ReportsMissingSecrets()
    {
        IReadOnlyList<string> failures = ValidationFailures(Environments.Production, []);

        failures.Should().Contain(failure => failure.Contains("Email:Host is required in the configuration"));
    }

    [Fact]
    public void Production_WithoutSupportEmail_DoesNotBlockStartup()
    {
        Dictionary<string, string?> values = CompleteConfiguration();
        values.Remove("Support:Email");

        ValidationFailures(Environments.Production, values).Should().BeEmpty();
    }

    [Fact]
    public void MalformedSupportEmail_IsRejected()
    {
        Dictionary<string, string?> values = CompleteConfiguration();
        values["Support:Email"] = "pas-une-adresse";

        ValidationFailures(Environments.Production, values)
            .Should().Contain(failure => failure.Contains("Support:Email must be a valid email address"));
    }

    [Fact]
    public void Development_WithEmptyConfiguration_ReportsNothing()
    {
        ValidationFailures(Environments.Development, []).Should().BeEmpty();
    }

    [Fact]
    public void Production_WithCompleteConfiguration_ReportsNothing()
    {
        ValidationFailures(Environments.Production, CompleteConfiguration()).Should().BeEmpty();
    }

    [Fact]
    public void Production_WithLoopbackFrontendUrl_IsRejected()
    {
        Dictionary<string, string?> values = CompleteConfiguration();
        values["Frontend:BaseUrl"] = "http://localhost:3000";

        ValidationFailures(Environments.Production, values)
            .Should().Contain(failure => failure.Contains("Frontend:BaseUrl is required outside development"));
    }

    [Fact]
    public void Development_WithOutOfRangeTokenExpiration_IsStillRejected()
    {
        Dictionary<string, string?> values = new() { ["Jwt:AccessTokenExpirationMinutes"] = "0" };

        ValidationFailures(Environments.Development, values)
            .Should().Contain(failure => failure.Contains("Jwt:AccessTokenExpirationMinutes"));
    }
}
