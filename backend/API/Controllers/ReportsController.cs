using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TMAflow.Infrastructure.Data;
using TMAflow.Domain.DTOs.Reports;
using TMAflow.Domain.Models;
using TMAflow.Application.Services;

namespace TMAflow.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly TMAflowContext _context;
    private readonly ReportService _reportService;

    public ReportsController(TMAflowContext context, ReportService reportService)
    {
        _context = context;
        _reportService = reportService;
    }

    [HttpGet]
    public async Task<IActionResult> GetReports([FromQuery] string? period, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        IQueryable<Report> query = _context.Reports
            .Where(r => r.OrganizationId == organizationId.Value);

        if (!string.IsNullOrEmpty(period))
            query = query.Where(r => r.Period == period);

        int total = await query.CountAsync();

        List<Report> reports = await query
            .OrderByDescending(r => r.GeneratedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = reports.Select(r =>
        {
            string title = r.ReportType switch
            {
                "monthly" => $"Rapport mensuel {r.Period}",
                "quarterly" => $"Rapport trimestriel {r.PeriodStart} — {r.PeriodEnd}",
                "custom" => $"Rapport personnalisé {r.PeriodStart} — {r.PeriodEnd}",
                _ => $"Rapport {r.Period}"
            };

            string? fileUrl = !string.IsNullOrEmpty(r.PdfPath) && System.IO.File.Exists(r.PdfPath)
                ? $"/api/reports/{r.Id}/pdf"
                : null;

            return new
            {
                r.Id,
                type = r.ReportType,
                title,
                r.PeriodStart,
                r.PeriodEnd,
                r.GeneratedAt,
                fileUrl
            };
        }).ToList();

        return Ok(new
        {
            items,
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)total / pageSize)
        });
    }

    [HttpPost("generate")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GenerateReport([FromBody] GenerateReportRequest dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        Report report = await _reportService.GenerateMonthlyReportAsync(organizationId.Value, dto);

        string? fileUrl = !string.IsNullOrEmpty(report.PdfPath) && System.IO.File.Exists(report.PdfPath)
            ? $"/api/reports/{report.Id}/pdf"
            : null;

        return CreatedAtAction(nameof(GetReports), null, new
        {
            report.Id,
            type = report.ReportType,
            report.PeriodStart,
            report.PeriodEnd,
            report.GeneratedAt,
            fileUrl
        });
    }

    [HttpPost("{id:guid}/send")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> SendReport(Guid id, [FromBody] SendReportRequest dto)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        bool reportExists = await _context.Reports
            .AnyAsync(r => r.Id == id && r.OrganizationId == organizationId.Value);

        if (!reportExists)
            return NotFound(new { message = "Rapport introuvable" });

        await _reportService.SendReportAsync(id, dto.RecipientEmail, dto.RecipientName);

        return Ok(new { message = "Rapport envoyé avec succès" });
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        Guid? organizationId = GetOrganizationId();
        if (organizationId == null) return Unauthorized();

        Report? report = await _context.Reports
            .FirstOrDefaultAsync(r => r.Id == id && r.OrganizationId == organizationId.Value);

        if (report == null)
            return NotFound(new { message = "Rapport introuvable" });

        if (string.IsNullOrEmpty(report.PdfPath) || !System.IO.File.Exists(report.PdfPath))
            return NotFound(new { message = "PDF non disponible" });

        byte[] bytes = await System.IO.File.ReadAllBytesAsync(report.PdfPath);
        return File(bytes, "application/pdf", $"rapport_{report.Period}.pdf");
    }

    private Guid? GetOrganizationId()
    {
        string? claim = User.FindFirst("organizationId")?.Value;
        return Guid.TryParse(claim, out Guid id) ? id : null;
    }
}
