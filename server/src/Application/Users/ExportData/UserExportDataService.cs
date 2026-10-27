using System.IO.Compression;
using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions.Persistence;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;

namespace Sentinel.Application.Users.ExportData;

public class UserExportDataService(
    IUserRepository userRepository,
    IAuditLogRepository auditLogRepository,
    ITicketRepository ticketRepository,
    ITicketCommentRepository ticketCommentRepository,
    ITicketAttachmentRepository ticketAttachmentRepository,
    ITenantContext tenant) : IService
{
    public async Task<Result<StreamedFileDownload>> ExecuteAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid currentUserId)
            return Result<StreamedFileDownload>.Unauthorized();

        Result<UserDataExportDto> export = await BuildExportAsync(organizationId, currentUserId, cancellationToken);

        if (!export.IsSuccess)
            return Result<StreamedFileDownload>.From(export);

        UserDataExportDto data = export.Value!;
        AttachmentPlan plan = PlanAttachments(data.Attachments);

        return new StreamedFileDownload(
            (destination, token) => WriteArchiveAsync(destination, data, plan, currentUserId, token),
            ContentTypes.Zip,
            UserDataArchive.FileName(data.ExportedAt));
    }

    private async Task<Result<UserDataExportDto>> BuildExportAsync(Guid organizationId, Guid currentUserId,
        CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetOrDefaultInOrganizationAsync(currentUserId, organizationId,
            QueryTracking.NoTracking, cancellationToken);

        if (user == null)
            return Result<UserDataExportDto>.NotFound(ErrorCodes.UserNotFound);

        int fetchSize = ExportLimits.MaxUserExportRows + 1;

        IReadOnlyList<UserExportTicketRow> ticketRows = await ticketRepository
            .ListForUserDataExportAsync(currentUserId, fetchSize, cancellationToken);

        IReadOnlyList<UserExportTicketCommentRow> commentRows = await ticketCommentRepository
            .ListForUserDataExportAsync(currentUserId, fetchSize, cancellationToken);

        IReadOnlyList<UserExportTicketAttachmentRow> attachmentRows = await ticketAttachmentRepository
            .ListForUserDataExportAsync(currentUserId, fetchSize, cancellationToken);

        IReadOnlyList<UserExportAuditLogRow> auditLogRows = await auditLogRepository
            .ListForUserExportAsync(currentUserId, fetchSize, cancellationToken);

        (List<UserExportTicketRow> tickets, bool ticketsTruncated) =
            ExportLimits.Cap(ticketRows, ExportLimits.MaxUserExportRows);
        (List<UserExportTicketCommentRow> comments, bool commentsTruncated) =
            ExportLimits.Cap(commentRows, ExportLimits.MaxUserExportRows);
        (List<UserExportTicketAttachmentRow> attachments, bool attachmentsTruncated) =
            ExportLimits.Cap(attachmentRows, ExportLimits.MaxUserExportRows);
        (List<UserExportAuditLogRow> auditLogs, bool auditLogsTruncated) =
            ExportLimits.Cap(auditLogRows, ExportLimits.MaxUserExportRows);

        return new UserDataExportDto
        {
            ExportedAt = DateTime.UtcNow,
            Profile = ToProfileDto(user),
            Tickets = tickets.Select(ToTicketDto).ToList(),
            Comments = comments.Select(ToCommentDto).ToList(),
            Attachments = attachments.Select(ToAttachmentDto).ToList(),
            AuditLogs = auditLogs.Select(ToAuditLogDto).ToList(),
            Truncated = new UserExportTruncationDto
            {
                MaxRowsPerCollection = ExportLimits.MaxUserExportRows,
                MaxAttachmentBytes = ExportLimits.MaxUserExportAttachmentBytes,
                Tickets = ticketsTruncated,
                Comments = commentsTruncated,
                Attachments = attachmentsTruncated,
                AuditLogs = auditLogsTruncated
            }
        };
    }

    private async Task WriteArchiveAsync(Stream destination, UserDataExportDto data, AttachmentPlan plan,
        Guid currentUserId, CancellationToken cancellationToken)
    {
        await using ZipArchive archive = await ZipArchive.CreateAsync(destination, ZipArchiveMode.Create,
            leaveOpen: true, entryNameEncoding: null, cancellationToken);

        Dictionary<Guid, string> archivePaths = [];

        foreach (IReadOnlyList<UserExportAttachmentDto> batch in Batch(plan.Included))
        {
            IReadOnlyList<UserExportAttachmentContentRow> contents = await ticketAttachmentRepository
                .ListContentsForUserAsync([.. batch.Select(attachment => attachment.Id)], currentUserId,
                    cancellationToken);

            Dictionary<Guid, byte[]> contentsById = contents.ToDictionary(row => row.Id, row => row.Content);

            foreach (UserExportAttachmentDto attachment in batch)
            {
                if (!contentsById.TryGetValue(attachment.Id, out byte[]? content) || content.Length == 0) continue;

                string entryName = UserDataArchive.EntryName(attachment);
                archivePaths[attachment.Id] = entryName;

                await UserDataArchive.WriteFileAsync(archive, entryName, content, cancellationToken);
            }
        }

        await UserDataArchive.WriteManifestAsync(archive, data, archivePaths, plan.SkippedOverBudget,
            cancellationToken);
    }

    private static AttachmentPlan PlanAttachments(IReadOnlyList<UserExportAttachmentDto> attachments)
    {
        List<UserExportAttachmentDto> included = [];
        long budget = ExportLimits.MaxUserExportAttachmentBytes;
        bool skipped = false;

        foreach (UserExportAttachmentDto attachment in attachments.Where(a => a.SizeBytes > 0))
        {
            if (attachment.SizeBytes > budget)
            {
                skipped = true;
                continue;
            }

            budget -= attachment.SizeBytes;
            included.Add(attachment);
        }

        return new AttachmentPlan(included, skipped);
    }

    private static IEnumerable<IReadOnlyList<UserExportAttachmentDto>> Batch(
        IReadOnlyList<UserExportAttachmentDto> attachments)
    {
        List<UserExportAttachmentDto> batch = [];
        long batchBytes = 0;

        foreach (UserExportAttachmentDto attachment in attachments)
        {
            bool full = batch.Count >= ExportLimits.MaxUserExportAttachmentBatch
                || batchBytes + attachment.SizeBytes > ExportLimits.MaxUserExportInFlightBytes;

            if (full && batch.Count > 0)
            {
                yield return batch;
                batch = [];
                batchBytes = 0;
            }

            batch.Add(attachment);
            batchBytes += attachment.SizeBytes;
        }

        if (batch.Count > 0) yield return batch;
    }

    private sealed record AttachmentPlan(IReadOnlyList<UserExportAttachmentDto> Included, bool SkippedOverBudget);

    private static UserExportProfileDto ToProfileDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Role = user.Role.ToString(),
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt,
        Language = user.Language
    };

    private static UserExportTicketDto ToTicketDto(UserExportTicketRow row) => new()
    {
        Id = row.Id,
        Number = row.Number,
        Title = row.Title,
        Description = row.Description,
        Status = row.Status.ToString(),
        Priority = row.Priority.ToString(),
        Type = row.Type.ToString(),
        ProjectName = row.ProjectName,
        IsCreator = row.IsCreator,
        IsAssignee = row.IsAssignee,
        CreatedAt = row.CreatedAt,
        UpdatedAt = row.UpdatedAt
    };

    private static UserExportCommentDto ToCommentDto(UserExportTicketCommentRow row) => new()
    {
        Id = row.Id,
        TicketId = row.TicketId,
        TicketNumber = row.TicketNumber,
        Content = row.Content,
        CreatedAt = row.CreatedAt,
        UpdatedAt = row.UpdatedAt
    };

    private static UserExportAttachmentDto ToAttachmentDto(UserExportTicketAttachmentRow row) => new()
    {
        Id = row.Id,
        TicketId = row.TicketId,
        TicketNumber = row.TicketNumber,
        FileName = row.FileName,
        ContentType = row.ContentType,
        SizeBytes = row.ContentLength,
        CreatedAt = row.CreatedAt
    };

    private static UserExportAuditLogDto ToAuditLogDto(UserExportAuditLogRow row) => new()
    {
        Id = row.Id,
        Action = row.Action,
        EntityType = row.EntityType,
        EntityId = row.EntityId,
        CreatedAt = row.CreatedAt
    };
}
