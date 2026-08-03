using System.Diagnostics.CodeAnalysis;
using FluentAssertions;
using Sentinel.Application.Abstractions;
using Sentinel.Domain.Abstractions;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Configuration;

public class RealtimeEmissionTests
{
    private const string ApplicationSourceDirectory = "backend/src/Application";

    private static readonly string[] MutationUseCaseVerbs =
        ["Create", "Update", "Delete", "Revoke", "Invite", "Accept", "Connect", "Add", "Upload"];

    private static readonly string[] ExemptedFromBroadcast =
        ["UserUpdatePreferencesService"];

    private static readonly string[] BroadcastMethods =
    [
        nameof(IRealtimeNotifier.NotifyOrganizationAsync),
        nameof(IRealtimeNotifier.NotifyAllAsync)
    ];

    [Fact]
    public void ChaqueServiceMutant_InjecteLeNotifieurTempsReel()
    {
        List<string> silent = BroadcastingServices()
            .Where(type => !InjectsRealtimeNotifier(type))
            .Select(type => type.FullName!)
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToList();

        silent.Should().BeEmpty(
            "a service that mutates state must inject IRealtimeNotifier, "
            + "otherwise the other users of the organization keep stale data indefinitely");
    }

    [Fact]
    public void ChaqueServiceMutant_AppelleLeNotifieurTempsReel()
    {
        List<string> silent = [];

        foreach (Type type in BroadcastingServices())
        {
            string? path = RepositoryFiles.FindByNameOrDefault(ApplicationSourceDirectory, $"{type.Name}.cs");

            if (path == null)
                ReportUnreachableSources();

            string source = File.ReadAllText(path!);

            if (!BroadcastMethods.Any(method => source.Contains(method, StringComparison.Ordinal)))
                silent.Add(type.FullName!);
        }

        silent.OrderBy(name => name, StringComparer.Ordinal).Should().BeEmpty(
            "injecting IRealtimeNotifier without ever calling it leaves the service silent: "
            + "the event must be broadcast after the commit");
    }

    [Fact]
    public void LesExemptionsDeDiffusion_CiblentUnServiceExistant()
    {
        List<string> serviceNames = MutationServices().Select(type => type.Name).ToList();

        ExemptedFromBroadcast.Should().BeSubsetOf(serviceNames,
            "an exemption that no longer targets any service must be removed from the list");
    }

    [DoesNotReturn]
    private static void ReportUnreachableSources()
    {
        string message = $"{ApplicationSourceDirectory} not found from {AppContext.BaseDirectory}";

        if (Environment.GetEnvironmentVariable("CI") != null)
            Assert.Fail($"{message}: in continuous integration this check must never be skipped");

        Assert.Skip($"{message}: partial checkout or build outside the tree, emission cannot be verified");
        throw new InvalidOperationException(message);
    }

    private static IReadOnlyList<Type> BroadcastingServices() => MutationServices()
        .Where(type => !ExemptedFromBroadcast.Contains(type.Name))
        .ToList();

    private static IReadOnlyList<Type> MutationServices() => typeof(IService).Assembly
        .GetTypes()
        .Where(type => type is { IsClass: true, IsAbstract: false } && typeof(IService).IsAssignableFrom(type))
        .Where(IsMutationUseCase)
        .ToList();

    private static bool IsMutationUseCase(Type type)
    {
        string? useCase = type.Namespace?.Split('.').LastOrDefault();

        return useCase != null
            && MutationUseCaseVerbs.Any(verb => useCase.StartsWith(verb, StringComparison.Ordinal));
    }

    private static bool InjectsRealtimeNotifier(Type type) => type
        .GetConstructors()
        .SelectMany(constructor => constructor.GetParameters())
        .Any(parameter => parameter.ParameterType == typeof(IRealtimeNotifier));
}
