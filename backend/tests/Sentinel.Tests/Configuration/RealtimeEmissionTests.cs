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
            "un service qui mute l'état doit injecter IRealtimeNotifier, "
            + "sinon les autres utilisateurs de l'organisation gardent des données périmées indéfiniment");
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
            "injecter IRealtimeNotifier sans jamais l'appeler laisse le service muet : "
            + "l'événement doit être diffusé après le commit");
    }

    [Fact]
    public void LesExemptionsDeDiffusion_CiblentUnServiceExistant()
    {
        List<string> serviceNames = MutationServices().Select(type => type.Name).ToList();

        ExemptedFromBroadcast.Should().BeSubsetOf(serviceNames,
            "une exemption qui ne cible plus aucun service doit être retirée de la liste");
    }

    [DoesNotReturn]
    private static void ReportUnreachableSources()
    {
        string message = $"{ApplicationSourceDirectory} est introuvable depuis {AppContext.BaseDirectory}";

        if (Environment.GetEnvironmentVariable("CI") != null)
            Assert.Fail($"{message} : en intégration continue ce contrôle ne doit jamais être ignoré");

        Assert.Skip($"{message} : dépôt partiel ou build hors arborescence, émission non vérifiable");
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
