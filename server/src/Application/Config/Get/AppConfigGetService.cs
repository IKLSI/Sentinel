using Microsoft.Extensions.Options;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Application.Options;

namespace Sentinel.Application.Config.Get;

public class AppConfigGetService(IOptions<SupportSettings> supportOptions) : IService
{
    public Result<AppConfigDto> Execute() => new AppConfigDto { SupportEmail = supportOptions.Value.Email };
}
