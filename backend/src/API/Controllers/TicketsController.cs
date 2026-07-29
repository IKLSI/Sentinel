using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sentinel.API.Attributes;
using Sentinel.API.Extensions;
using Sentinel.Application.Common;
using Sentinel.Application.Tickets.AddComment;
using Sentinel.Application.Tickets.ChangeStatus;
using Sentinel.Application.Tickets.Create;
using Sentinel.Application.Tickets.Delete;
using Sentinel.Application.Tickets.DeleteComment;
using Sentinel.Application.Tickets.DownloadAttachment;
using Sentinel.Application.Tickets.ExportExcel;
using Sentinel.Application.Tickets.GetById;
using Sentinel.Application.Tickets.Grid;
using Sentinel.Application.Tickets.Update;
using Sentinel.Application.Tickets.UpdateComment;
using Sentinel.Application.Tickets.UploadAttachment;
using Sentinel.Domain.DTOs.Common;
using Sentinel.Domain.DTOs.Tickets;
using Sentinel.Domain.Models;

namespace Sentinel.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/tickets")]
[Route("api/v{version:apiVersion}/tickets")]
[Authorize]
public class TicketsController : BaseController
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<TicketDto>>> GetTickets(
        [FromQuery] TicketGridModel query,
        [FromServices] TicketGridService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(query, cancellationToken));

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel(
        [FromQuery] TicketExportExcelModel query,
        [FromServices] TicketExportExcelService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(query, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<TicketDto>> CreateTicket(
        [FromBody] CreateTicketDto dto,
        [FromServices] TicketCreateService service,
        CancellationToken cancellationToken)
    {
        Result<TicketDto> result = await service.ExecuteAsync(dto, cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetTicket), new { id = result.Value!.Id }, result.Value)
            : ToActionResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDto>> GetTicket(
        Guid id,
        [FromServices] TicketGetByIdService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TicketDto>> UpdateTicket(
        Guid id,
        [FromBody] UpdateTicketDto dto,
        [FromServices] TicketUpdateService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, dto, cancellationToken));

    [HttpDelete("{id:guid}")]
    [AuthorizeRoles(UserRole.Admin)]
    public async Task<IActionResult> DeleteTicket(
        Guid id,
        [FromServices] TicketDeleteService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, cancellationToken));

    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<TicketCommentDto>> AddComment(
        Guid id,
        [FromBody] CreateCommentDto dto,
        [FromServices] TicketAddCommentService service,
        CancellationToken cancellationToken)
    {
        Result<TicketCommentDto> result = await service.ExecuteAsync(id, dto, cancellationToken);

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetTicket), new { id }, result.Value)
            : ToActionResult(result);
    }

    [HttpPut("{id:guid}/comments/{commentId:guid}")]
    public async Task<ActionResult<TicketCommentDto>> UpdateComment(
        Guid id,
        Guid commentId,
        [FromBody] CreateCommentDto dto,
        [FromServices] TicketUpdateCommentService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, commentId, dto, cancellationToken));

    [HttpDelete("{id:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(
        Guid id,
        Guid commentId,
        [FromServices] TicketDeleteCommentService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, commentId, cancellationToken));

    [HttpPost("{id:guid}/attachments")]
    [RequestSizeLimit(10_485_760)]
    public async Task<ActionResult<TicketAttachmentDto>> UploadAttachment(
        Guid id,
        IFormFile? file,
        [FromServices] TicketUploadAttachmentService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, file.ToUploadModel(), cancellationToken));

    [HttpGet("{id:guid}/attachments/{attachmentId:guid}")]
    public async Task<IActionResult> DownloadAttachment(
        Guid id,
        Guid attachmentId,
        [FromServices] TicketDownloadAttachmentService service,
        CancellationToken cancellationToken) =>
        ToFileResult(await service.ExecuteAsync(id, attachmentId, cancellationToken));

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TicketDto>> ChangeStatus(
        Guid id,
        [FromBody] ChangeStatusDto dto,
        [FromServices] TicketChangeStatusService service,
        CancellationToken cancellationToken) =>
        ToActionResult(await service.ExecuteAsync(id, dto, cancellationToken));
}
