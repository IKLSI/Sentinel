using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.Application.TicketStatuses.GetAll;
using Sentinel.Domain.DTOs.Tickets;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/statuses")]
[Route("api/v{version:apiVersion}/statuses")]
[Authorize]
public class TicketStatusesController : BaseController
{
    [HttpGet]
    public async Task<ActionResult<List<TicketStatusDto>>> GetStatuses(
        [FromServices] TicketStatusListService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(cancellationToken));
}
