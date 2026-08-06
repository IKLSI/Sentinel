using System.Text.Json;
using System.Text.Json.Serialization;
using Sentinel.API.Realtime;
using Sentinel.Domain.Abstractions;

namespace Sentinel.API.Extensions;

public static partial class ServiceCollectionExtensions
{
    public static IServiceCollection AddRealtimeServices(this IServiceCollection services)
    {
        services.AddSignalR().AddJsonProtocol(options =>
        {
            options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        });

        services.AddSingleton<IRealtimeNotifier, SignalRRealtimeNotifier>();

        return services;
    }
}
