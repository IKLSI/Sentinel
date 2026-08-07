using Sentinel.Application.Abstractions;
using Sentinel.Application.Common;
using Sentinel.Domain.Abstractions;
using Sentinel.Domain.Abstractions.Persistence;
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
    public async Task<Result<FileDownload>> ExecuteAsync(CancellationToken cancellationToken)
    {
        Result<UserDataExportDto> export = await BuildExportAsync(cancellationToken);

        if (!export.IsSuccess)
            return Result<FileDownload>.From(export);

        UserDataExportDto data = export.Value!;

        IReadOnlyList<UserDataArchiveFile> files = await LoadAttachmentFilesAsync(data, cancellationToken);
        byte[] archive = UserDataArchive.Build(data, files);

        return FileDownload.FromBytes(archive, ContentTypes.Zip, UserDataArchive.FileName(data.ExportedAt));
    }

    private async Task<Result<UserDataExportDto>> BuildExportAsync(CancellationToken cancellationToken)
    {
        if (tenant.OrganizationId is not Guid organizationId || tenant.UserId is not Guid currentUserId)
            return Result<UserDataExportDto>.Unauthorized();

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

        return new UserDataExportDto
        {
            ExportedAt = DateTime.UtcNow,
            Profile = new UserExportProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Language = user.Language
            },
            Tickets = Page(ticketRows).Select(row => new UserExportTicketDto
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
            }).ToList(),
            Comments = Page(commentRows).Select(row => new UserExportCommentDto
            {
                Id = row.Id,
                TicketId = row.TicketId,
                TicketNumber = row.TicketNumber,
                Content = row.Content,
                CreatedAt = row.CreatedAt,
                UpdatedAt = row.UpdatedAt
            }).ToList(),
            Attachments = Page(attachmentRows).Select(row => new UserExportAttachmentDto
            {
                Id = row.Id,
                TicketId = row.TicketId,
                TicketNumber = row.TicketNumber,
                FileName = row.FileName,
                ContentType = row.ContentType,
                CreatedAt = row.CreatedAt
            }).ToList(),
            AuditLogs = Page(auditLogRows).Select(row => new UserExportAuditLogDto
            {
                Id = row.Id,
                Action = row.Action,
                EntityType = row.EntityType,
                EntityId = row.EntityId,
                CreatedAt = row.CreatedAt
            }).ToList(),
            Truncated = new UserExportTruncationDto
            {
                MaxRowsPerCollection = ExportLimits.MaxUserExportRows,
                MaxAttachmentBytes = ExportLimits.MaxUserExportAttachmentBytes,
                Tickets = IsTruncated(ticketRows),
                Comments = IsTruncated(commentRows),
                Attachments = IsTruncated(attachmentRows),
                AuditLogs = IsTruncated(auditLogRows)
            }
        };
    }

    private async Task<IReadOnlyList<UserDataArchiveFile>> LoadAttachmentFilesAsync(UserDataExportDto export,
        CancellationToken cancellationToken)
    {
        if (tenant.UserId is not Guid currentUserId) return [];

        List<UserDataArchiveFile> files = [];
        long budget = ExportLimits.MaxUserExportAttachmentBytes;

        foreach (UserExportAttachmentDto attachment in export.Attachments)
        {
            byte[]? content = await ticketAttachmentRepository
                .GetContentForUserOrDefaultAsync(attachment.Id, currentUserId, cancellationToken);

            if (content == null || content.Length == 0) continue;

            if (content.Length > budget)
            {
                export.Truncated.AttachmentFiles = true;
                continue;
            }

            budget -= content.Length;
            files.Add(new UserDataArchiveFile(attachment.Id, attachment.TicketNumber, attachment.FileName, content));
        }

        return files;
    }

    private static IEnumerable<T> Page<T>(IReadOnlyList<T> rows) => rows.Take(ExportLimits.MaxUserExportRows);

    private static bool IsTruncated<T>(IReadOnlyList<T> rows) => rows.Count > ExportLimits.MaxUserExportRows;
}
