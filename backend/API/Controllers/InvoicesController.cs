using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sentinel.Infrastructure.Data;
using Sentinel.Domain.DTOs.Invoices;
using Sentinel.Domain.Models;
using Sentinel.Application.Services;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController : BaseController
{
    private readonly SentinelContext _context;
    private readonly InvoiceService _invoiceService;
    private readonly ExportService _exportService;

    public InvoicesController(SentinelContext context, InvoiceService invoiceService, ExportService exportService)
    {
        _context = context;
        _invoiceService = invoiceService;
        _exportService = exportService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoices([FromQuery] string? status, [FromQuery] string? period)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null || organizationId == Guid.Empty)
        {
            return Unauthorized();
        }

        IQueryable<Invoice> query = _context.Invoices
            .Include(i => i.TechProject)
            .Where(i => i.OrganizationId == organizationId.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InvoiceStatus>(status, true, out InvoiceStatus parsedStatus))
        {
            query = query.Where(i => i.Status == parsedStatus);
        }

        if (!string.IsNullOrEmpty(period))
        {
            query = query.Where(i => i.Period == period);
        }

        List<Invoice> invoices = await query.OrderByDescending(i => i.IssuedAt).ToListAsync();

        return Ok(invoices.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InvoiceDto>> GetInvoice(Guid id)
    {
        Guid? organizationId = GetOrganizationId();

        if (organizationId == null || organizationId == Guid.Empty)
        {
            return Unauthorized();
        }

        Invoice? invoice = await _context.Invoices
            .Include(i => i.TechProject)
            .FirstOrDefaultAsync(i => i.Id == id && i.OrganizationId == organizationId.Value);

        if (invoice == null)
        {
            return NotFound(new { message = "Facture introuvable" });
        }

        return Ok(MapToDto(invoice));
    }

    [HttpPost("generate")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<InvoiceDto>> GenerateInvoice([FromBody] GenerateInvoiceDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        dto.OrganizationId = organizationId.Value;

        Invoice invoice = await _invoiceService.GenerateInvoiceAsync(dto);

        Invoice result = await _context.Invoices
            .Include(i => i.TechProject)
            .FirstAsync(i => i.Id == invoice.Id);

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, MapToDto(result));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteInvoice(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        Invoice? invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.Id == id && i.OrganizationId == organizationId.Value);

        if (invoice == null)
            return NotFound(new { message = "Facture introuvable" });

        if (invoice.Status != InvoiceStatus.Draft)
            return BadRequest(new { message = "Seules les factures en brouillon peuvent être supprimées" });

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<InvoiceDto>> UpdateStatus(Guid id, [FromBody] UpdateInvoiceStatusDto dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        bool invoiceExists = await _context.Invoices
            .AnyAsync(i => i.Id == id && i.OrganizationId == organizationId.Value);

        if (!invoiceExists)
            return NotFound(new { message = "Facture introuvable" });

        if (!Enum.TryParse<InvoiceStatus>(dto.Status, true, out InvoiceStatus parsedStatus))
            return BadRequest(new { message = "Statut invalide. Valeurs acceptées : Draft, Sent, Paid" });

        await _invoiceService.UpdateStatusAsync(id, parsedStatus);

        Invoice result = await _context.Invoices
            .Include(i => i.TechProject)
            .FirstAsync(i => i.Id == id);

        return Ok(MapToDto(result));
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] string? status, [FromQuery] string? period)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        byte[] bytes = await _exportService.ExportInvoicesExcelAsync(organizationId.Value, status, period);
        string filename = string.IsNullOrEmpty(period) ? "factures.xlsx" : $"factures-{period}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        Invoice? invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.Id == id && i.OrganizationId == organizationId.Value);

        if (invoice == null)
            return NotFound(new { message = "Facture introuvable" });

        if (invoice.PdfData == null || invoice.PdfData.Length == 0)
            return NotFound(new { message = "PDF non disponible" });

        return File(invoice.PdfData, "application/pdf", $"facture_{invoice.Period}_{invoice.Id}.pdf");
    }

    private static InvoiceDto MapToDto(Invoice invoice)
    {
        int year = invoice.IssuedAt.Year;
        int num = invoice.InvoiceNumber > 0 ? invoice.InvoiceNumber : 1;
        return new InvoiceDto
        {
            Id = invoice.Id,
            Reference = $"FAC-{year}-{num:D3}",
            OrganizationId = invoice.OrganizationId,
            TechProjectId = invoice.TechProjectId,
            TechProjectName = invoice.TechProject?.Name,
            Label = invoice.Label,
            DailyRate = invoice.DailyRate,
            Period = invoice.Period,
            TotalHours = invoice.TotalHours,
            TotalAmount = invoice.TotalAmount,
            TaxRate = invoice.TaxRate,
            Status = invoice.Status.ToString(),
            IssuedAt = invoice.IssuedAt,
            DueAt = invoice.DueAt,
            PaidAt = invoice.PaidAt,
            HasPdf = invoice.PdfData != null && invoice.PdfData.Length > 0
        };
    }

}
