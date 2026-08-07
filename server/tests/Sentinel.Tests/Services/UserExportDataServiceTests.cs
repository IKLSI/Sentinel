using System.IO.Compression;
using System.Text.Json;
using FluentAssertions;
using Sentinel.Application.Common;
using Sentinel.Application.Users.ExportData;
using Sentinel.Domain.Constants;
using Sentinel.Domain.Entities;
using Sentinel.Domain.Repositories;
using Sentinel.Infrastructure.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Services;

public class UserExportDataServiceTests
{
    private static readonly JsonSerializerOptions ManifestOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };
    [Fact]
    public async Task ExecuteAsync_RemonteProfilTicketsCommentairesPiecesJointesEtJournal()
    {
        using TestScope scope = new TestScope();
        await SeedUserDataAsync(scope);

        UserExportDataService sut = BuildService(scope);

        Result<StreamedFileDownload> result = await sut.ExecuteAsync(CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.ContentType.Should().Be(ContentTypes.Zip);
        result.Value.FileName.Should().StartWith("sentinel-export-").And.EndWith(".zip");

        UserDataExportDto export = await ReadManifestAsync(result.Value);
        export.Profile.Email.Should().Be("membre@test.fr");

        export.Tickets.Should().HaveCount(2);
        export.Tickets.Should().ContainSingle(ticket => ticket.IsCreator && !ticket.IsAssignee);
        export.Tickets.Should().ContainSingle(ticket => ticket.IsAssignee && !ticket.IsCreator);

        export.Comments.Should().ContainSingle();
        export.Comments[0].Content.Should().Be("Mon commentaire");
        export.Comments[0].TicketNumber.Should().Be(1);

        export.Attachments.Should().ContainSingle();
        export.Attachments[0].FileName.Should().Be("trace.log");
        export.Attachments[0].ContentType.Should().Be("text/plain");

        export.AuditLogs.Should().ContainSingle();
        export.AuditLogs[0].Action.Should().Be(AuditAction.Login.ToString());
    }

    [Fact]
    public async Task ExecuteAsync_NeRemontePasLesDonneesDesAutresUtilisateurs()
    {
        using TestScope scope = new TestScope();
        await SeedUserDataAsync(scope);

        Guid otherUserId = Guid.NewGuid();
        await scope.SeedAsync(NewUser(scope.OrganizationId, otherUserId, "autre@test.fr"));
        await scope.SeedAsync(NewTicket(scope.OrganizationId, 3, otherUserId, otherUserId));

        UserExportDataService sut = BuildService(scope);

        UserDataExportDto export = await ReadManifestAsync((await sut.ExecuteAsync(CancellationToken.None)).Value!);

        export.Tickets.Should().HaveCount(2);
        export.Tickets.Should().NotContain(ticket => ticket.Number == 3);
    }

    [Fact]
    public async Task ExecuteAsync_JointLesFichiersDesPiecesJointesALArchive()
    {
        using TestScope scope = new TestScope();
        await SeedUserDataAsync(scope);

        UserExportDataService sut = BuildService(scope);

        StreamedFileDownload download = (await sut.ExecuteAsync(CancellationToken.None)).Value!;
        using ZipArchive archive = await OpenArchiveAsync(download);

        UserDataExportDto export = ReadManifest(archive);
        string archivePath = export.Attachments.Should().ContainSingle().Subject.ArchivePath!;

        archivePath.Should().StartWith($"{UserDataArchive.AttachmentsDirectory}/").And.EndWith("trace.log");

        ZipArchiveEntry entry = archive.GetEntry(archivePath).Should().NotBeNull().And.Subject.As<ZipArchiveEntry>();
        using StreamReader reader = new(entry.Open());

        (await reader.ReadToEndAsync()).Should().Be("contenu de la trace");
        export.Truncated.AttachmentFiles.Should().BeFalse();
    }

    [Fact]
    public async Task ExecuteAsync_NExposePasLesFichiersDesAutresUtilisateurs()
    {
        using TestScope scope = new TestScope();
        await SeedUserDataAsync(scope);

        Guid otherUserId = Guid.NewGuid();
        Ticket otherTicket = NewTicket(scope.OrganizationId, 3, otherUserId, otherUserId);
        await scope.SeedAsync(NewUser(scope.OrganizationId, otherUserId, "autre@test.fr"), otherTicket);
        await scope.SeedAsync(new TicketAttachment
        {
            TicketId = otherTicket.Id,
            UploadedById = otherUserId,
            FileName = "prive.log",
            ContentType = "text/plain",
            Content = "secret"u8.ToArray(),
            ContentLength = "secret"u8.Length
        });

        UserExportDataService sut = BuildService(scope);

        using ZipArchive archive = await OpenArchiveAsync((await sut.ExecuteAsync(CancellationToken.None)).Value!);

        archive.Entries.Should().NotContain(entry => entry.Name.Contains("prive"));
        ReadManifest(archive).Attachments.Should().ContainSingle();
    }

    [Fact]
    public async Task ExecuteAsync_QuandRienNEstTronque_RemonteLesDrapeauxAFalse()
    {
        using TestScope scope = new TestScope();
        await SeedUserDataAsync(scope);

        UserExportDataService sut = BuildService(scope);

        UserExportTruncationDto truncated =
            (await ReadManifestAsync((await sut.ExecuteAsync(CancellationToken.None)).Value!)).Truncated;

        truncated.MaxRowsPerCollection.Should().Be(ExportLimits.MaxUserExportRows);
        truncated.Tickets.Should().BeFalse();
        truncated.Comments.Should().BeFalse();
        truncated.Attachments.Should().BeFalse();
        truncated.AuditLogs.Should().BeFalse();
    }

    [Fact]
    public async Task ExecuteAsync_QuandUnFichierDepasseLeBudget_NeLeJointPasEtLeSignale()
    {
        using TestScope scope = new TestScope();
        await SeedUserDataAsync(scope);

        Ticket ticket = NewTicket(scope.OrganizationId, 4, scope.UserId, assignedToId: null);
        await scope.SeedAsync(ticket);
        await scope.SeedAsync(new TicketAttachment
        {
            TicketId = ticket.Id,
            UploadedById = scope.UserId,
            FileName = "enorme.bin",
            ContentType = "application/octet-stream",
            Content = "peu importe"u8.ToArray(),
            ContentLength = ExportLimits.MaxUserExportAttachmentBytes + 1
        });

        UserExportDataService sut = BuildService(scope);

        using ZipArchive archive = await OpenArchiveAsync((await sut.ExecuteAsync(CancellationToken.None)).Value!);
        UserDataExportDto export = ReadManifest(archive);

        export.Truncated.AttachmentFiles.Should().BeTrue();
        archive.Entries.Should().NotContain(entry => entry.Name.Contains("enorme"));

        export.Attachments.Should().ContainSingle(attachment => attachment.FileName == "enorme.bin")
            .Which.ArchivePath.Should().BeNull();

        export.Attachments.Should().ContainSingle(attachment => attachment.FileName == "trace.log")
            .Which.ArchivePath.Should().NotBeNull();
    }

    [Fact]
    public async Task ExecuteAsync_QuandLeNomDeFichierEstTropLong_ConserveLExtension()
    {
        using TestScope scope = new TestScope();
        await SeedUserDataAsync(scope);

        Ticket ticket = NewTicket(scope.OrganizationId, 5, scope.UserId, assignedToId: null);
        await scope.SeedAsync(ticket);
        await scope.SeedAsync(new TicketAttachment
        {
            TicketId = ticket.Id,
            UploadedById = scope.UserId,
            FileName = $"{new string('a', ExportLimits.MaxArchiveFileNameLength + 50)}.log",
            ContentType = "text/plain",
            Content = "contenu"u8.ToArray(),
            ContentLength = "contenu"u8.Length
        });

        UserExportDataService sut = BuildService(scope);

        UserDataExportDto export = await ReadManifestAsync((await sut.ExecuteAsync(CancellationToken.None)).Value!);

        export.Attachments.Should().Contain(attachment => attachment.TicketNumber == 5)
            .Which.ArchivePath.Should().EndWith(".log");
    }

    [Fact]
    public async Task ListForUserDataExportAsync_BorneLeNombreDeLignes()
    {
        using TestScope scope = new TestScope();
        await SeedUserDataAsync(scope);

        IReadOnlyList<UserExportTicketRow> rows = await scope.Tickets
            .ListForUserDataExportAsync(scope.UserId, 1, CancellationToken.None);

        rows.Should().ContainSingle();
    }

    private static async Task<ZipArchive> OpenArchiveAsync(StreamedFileDownload download)
    {
        MemoryStream buffer = new();
        await download.WriteAsync(buffer, CancellationToken.None);
        buffer.Position = 0;

        return new ZipArchive(buffer, ZipArchiveMode.Read);
    }

    private static async Task<UserDataExportDto> ReadManifestAsync(StreamedFileDownload download)
    {
        using ZipArchive archive = await OpenArchiveAsync(download);
        return ReadManifest(archive);
    }

    private static UserDataExportDto ReadManifest(ZipArchive archive)
    {
        using Stream manifest = archive.GetEntry(UserDataArchive.ManifestEntryName)!.Open();
        return JsonSerializer.Deserialize<UserDataExportDto>(manifest, ManifestOptions)!;
    }

    private static UserExportDataService BuildService(TestScope scope) => new(
        scope.Users,
        new AuditLogRepository(scope.Context),
        scope.Tickets,
        new TicketCommentRepository(scope.Context),
        new TicketAttachmentRepository(scope.Context),
        scope.Tenant);

    private static async Task SeedUserDataAsync(TestScope scope)
    {
        await scope.SeedAsync(scope.NewOrganization());
        await scope.SeedAsync(NewUser(scope.OrganizationId, scope.UserId, "membre@test.fr"));

        Ticket created = NewTicket(scope.OrganizationId, 1, scope.UserId, assignedToId: null);
        Ticket assigned = NewTicket(scope.OrganizationId, 2, Guid.NewGuid(), scope.UserId);

        await scope.SeedAsync(created, assigned);

        await scope.SeedAsync(new TicketComment
        {
            TicketId = created.Id,
            AuthorId = scope.UserId,
            Content = "Mon commentaire"
        });

        await scope.SeedAsync(new TicketAttachment
        {
            TicketId = created.Id,
            UploadedById = scope.UserId,
            FileName = "trace.log",
            ContentType = "text/plain",
            Content = "contenu de la trace"u8.ToArray(),
            ContentLength = "contenu de la trace"u8.Length
        });

        await scope.SeedAsync(new AuditLog
        {
            OrganizationId = scope.OrganizationId,
            UserId = scope.UserId,
            Action = AuditAction.Login,
            EntityType = nameof(User)
        });
    }

    private static Ticket NewTicket(Guid organizationId, int number, Guid createdById, Guid? assignedToId) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = organizationId,
        Number = number,
        Title = $"Ticket {number}",
        Description = "Description",
        CreatedById = createdById,
        AssignedToId = assignedToId
    };

    private static User NewUser(Guid organizationId, Guid userId, string email) => new()
    {
        Id = userId,
        OrganizationId = organizationId,
        Email = email,
        FirstName = "Membre",
        LastName = "Test",
        PasswordHash = "hash",
        Role = UserRole.Developer,
        AccessStatus = UserAccessStatus.Active
    };
}
