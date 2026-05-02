using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Kanban;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/kanban/columns")]
[Authorize]
public class KanbanColumnsController : BaseController
{
    private readonly SentinelContext _context;

    private static readonly (string Status, string Name, string Color, int Order)[] SystemColumns =
    [
        ("new",         "Nouveau",      "var(--accent)",  0),
        ("in_progress", "En cours",     "var(--orange)",  1),
        ("testing",     "Tests",        "var(--cyan)",    2),
        ("resolved",    "Résolu",       "var(--green)",   3),
        ("closed",      "Fermé",        "var(--muted2)",  4),
    ];

    public KanbanColumnsController(SentinelContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<KanbanColumnDto>>> GetColumns()
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        bool hasAny = await _context.KanbanColumns
            .AnyAsync(c => c.OrganizationId == organizationId.Value);

        if (!hasAny)
        {
            var seed = SystemColumns.Select(s => new KanbanColumn
            {
                OrganizationId = organizationId.Value,
                Name = s.Name,
                Color = s.Color,
                Order = s.Order,
                SystemStatus = s.Status,
            }).ToList();

            await _context.KanbanColumns.AddRangeAsync(seed);
            await _context.SaveChangesAsync();
        }

        List<KanbanColumnDto> columns = await _context.KanbanColumns
            .Where(c => c.OrganizationId == organizationId.Value)
            .OrderBy(c => c.Order)
            .Select(c => new KanbanColumnDto
            {
                Id = c.Id,
                Name = c.Name,
                Color = c.Color,
                Order = c.Order,
                TicketCount = c.Tickets.Count,
                SystemStatus = c.SystemStatus,
            })
            .ToListAsync();

        return Ok(columns);
    }

    [HttpPost]
    public async Task<ActionResult<KanbanColumnDto>> CreateColumn([FromBody] CreateKanbanColumnDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Le nom de la colonne est requis" });

        if (dto.Name.Length > 50)
            return BadRequest(new { message = "Le nom ne peut pas dépasser 50 caractères" });

        int maxOrder = await _context.KanbanColumns
            .Where(c => c.OrganizationId == organizationId.Value)
            .Select(c => (int?)c.Order)
            .MaxAsync() ?? -1;

        KanbanColumn column = new KanbanColumn
        {
            OrganizationId = organizationId.Value,
            Name = dto.Name.Trim(),
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "var(--muted2)" : dto.Color,
            Order = maxOrder + 1,
            SystemStatus = null,
        };

        await _context.KanbanColumns.AddAsync(column);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetColumns), new KanbanColumnDto
        {
            Id = column.Id,
            Name = column.Name,
            Color = column.Color,
            Order = column.Order,
            TicketCount = 0,
            SystemStatus = null,
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteColumn(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        KanbanColumn? column = await _context.KanbanColumns
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == organizationId.Value);

        if (column == null)
            return NotFound(new { message = "Colonne introuvable" });

        if (column.SystemStatus != null)
            return BadRequest(new { message = "Impossible de supprimer une colonne système" });

        await _context.Tickets
            .Where(t => t.KanbanColumnId == id)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.KanbanColumnId, (Guid?)null));

        _context.KanbanColumns.Remove(column);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
