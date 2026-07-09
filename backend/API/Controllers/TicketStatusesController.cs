using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/statuses")]
[Route("api/v{version:apiVersion}/statuses")]
[Authorize]
public class TicketStatusesController : BaseController
{
    private readonly SentinelContext _context;

    private static readonly (string Name, string Color, bool IsClosed, int Order, bool IsDefault)[] DefaultStatuses =
    [
        ("Nouveau",  "var(--accent)",  false, 0, true),
        ("En cours", "var(--orange)", false, 1, false),
        ("Tests",    "var(--cyan)",   false, 2, false),
        ("Résolu",   "var(--green)",  true,  3, false),
        ("Fermé",    "var(--muted2)", true,  4, false),
    ];

    public TicketStatusesController(SentinelContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<TicketStatusDto>>> GetStatuses()
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null) return Unauthorized();

        bool hasAny = await _context.TicketStatuses
            .AnyAsync(s => s.OrganizationId == organizationId.Value);

        if (!hasAny)
        {
            var seed = DefaultStatuses.Select(d => new TicketStatus
            {
                OrganizationId = organizationId.Value,
                Name = d.Name,
                Color = d.Color,
                Order = d.Order,
                IsDefault = d.IsDefault,
                IsClosed = d.IsClosed,
            }).ToList();

            await _context.TicketStatuses.AddRangeAsync(seed);
            await _context.SaveChangesAsync();
        }

        List<TicketStatusDto> statuses = await _context.TicketStatuses
            .AsNoTracking()
            .Where(s => s.OrganizationId == organizationId.Value)
            .OrderBy(s => s.Order)
            .Select(s => new TicketStatusDto
            {
                Id = s.Id,
                Name = s.Name,
                Color = s.Color,
                Order = s.Order,
                IsDefault = s.IsDefault,
                IsClosed = s.IsClosed,
                TicketCount = s.Tickets.Count(),
            })
            .ToListAsync();

        return Ok(statuses);
    }
}
