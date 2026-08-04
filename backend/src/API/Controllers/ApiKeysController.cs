using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.Application.ApiKeys.Create;
using Sentinel.Application.ApiKeys.GetAll;
using Sentinel.Application.ApiKeys.Revoke;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Models;
using Sentinel.Domain.Repositories;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/settings/api-keys")]
[Route("api/v{version:apiVersion}/settings/api-keys")]
[Authorize]
[AuthorizeRoles(UserRole.Admin)]
public class ApiKeysController : BaseController
{
    [HttpGet]
    public async Task<ActionResult<List<ApiKeyDto>>> List(
        [FromServices] ApiKeyListService service,
        [FromQuery] ApiKeySortField sortBy = ApiKeySortField.Created,
        [FromQuery] SortDirection sortDirection = SortDirection.Desc,
        CancellationToken cancellationToken = default) =>
        ToActionResult(await service.ExecuteAsync(sortBy, sortDirection, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<CreatedApiKeyDto>> Create(
        [FromBody] CreateApiKeyDto dto,
        [FromServices] ApiKeyCreateService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(dto, cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Revoke(
        Guid id,
        [FromServices] ApiKeyRevokeService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));
}
