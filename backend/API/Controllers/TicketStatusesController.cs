using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
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
    private readonly IMemoryCache _cache;
    private const string DashboardCacheKeyPrefix = "dashboard";

    private static readonly (string Name, string Color, bool IsClosed, int Order, bool IsDefault)[] DefaultStatuses =
    [
        ("Nouveau",  "var(--accent)",  false, 0, true),
        ("En cours", "var(--orange)", false, 1, false),
        ("Tests",    "var(--cyan)",   false, 2, false),
        ("Résolu",   "var(--green)",  true,  3, false),
        ("Fermé",    "var(--muted2)", true,  4, false),
    ];

    public TicketStatusesController(SentinelContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
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

    [HttpPost]
    public async Task<ActionResult<TicketStatusDto>> CreateStatus([FromBody] CreateTicketStatusDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Le nom du statut est requis" });

        if (dto.Name.Length > 50)
            return BadRequest(new { message = "Le nom ne peut pas dépasser 50 caractères" });

        int maxOrder = await _context.TicketStatuses
            .Where(s => s.OrganizationId == organizationId.Value)
            .Select(s => (int?)s.Order)
            .MaxAsync() ?? -1;

        TicketStatus status = new TicketStatus
        {
            OrganizationId = organizationId.Value,
            Name = dto.Name.Trim(),
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "var(--muted2)" : dto.Color,
            Order = maxOrder + 1,
            IsDefault = false,
            IsClosed = false,
        };

        await _context.TicketStatuses.AddAsync(status);
        await _context.SaveChangesAsync();

        try { _cache.Remove($"{DashboardCacheKeyPrefix}:{organizationId.Value}"); } catch {}

        return CreatedAtAction(nameof(GetStatuses), new TicketStatusDto
        {
            Id = status.Id,
            Name = status.Name,
            Color = status.Color,
            Order = status.Order,
            IsDefault = false,
            IsClosed = false,
            TicketCount = 0,
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteStatus(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        TicketStatus? status = await _context.TicketStatuses
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == organizationId.Value);

        if (status == null)
            return NotFound(new { message = "Statut introuvable" });

        if (status.IsDefault)
            return BadRequest(new { message = "Impossible de supprimer le statut par défaut" });

        bool hasTickets = await _context.Tickets.AnyAsync(t => t.TicketStatusId == id);
        if (hasTickets)
            return BadRequest(new { message = "Impossible de supprimer un statut contenant des tickets" });

        _context.TicketStatuses.Remove(status);
        await _context.SaveChangesAsync();

        try { _cache.Remove($"{DashboardCacheKeyPrefix}:{organizationId.Value}"); } catch {}

        return NoContent();
    }
}
