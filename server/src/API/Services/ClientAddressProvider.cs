using Sentinel.Domain.Abstractions;

namespace Sentinel.API.Services;

public class ClientAddressProvider : IClientAddressProvider
{
    private const string UnknownAddress = "unknown";

    private readonly IHttpContextAccessor _httpContextAccessor;

    public ClientAddressProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string Current =>
        _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? UnknownAddress;
}
