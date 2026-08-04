using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Options;

namespace Sentinel.Application.Config.Get;

public class AppConfigGetService : IService
{
    private readonly SupportSettings _support;

    public AppConfigGetService(IOptions<SupportSettings> supportOptions)
    {
        _support = supportOptions.Value;
    }

    public Result<AppConfigDto> Execute() => new AppConfigDto { SupportEmail = _support.Email };
}
