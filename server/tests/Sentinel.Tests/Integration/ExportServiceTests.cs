using ClosedXML.Excel;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Sentinel.Application.Exports;
using Sentinel.Domain.Repositories;
using Sentinel.Tests.Helpers;

namespace Sentinel.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class ExportServiceTests
{
    private const int FirstDataRow = 4;

    private readonly PostgresFixture _fixture;

    public ExportServiceTests(PostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task ExportTicketsExcelAsync_UtiliseLaReferenceAfficheeEtEncadreLesLignes()
    {
        _fixture.EnsureAvailable();

        await using PostgresScope scope = new PostgresScope(_fixture);
        await scope.SeedAsync(scope.NewOrganization(), scope.NewUser(),
            scope.NewTicket("Premier", number: 7), scope.NewTicket("Second", number: 42));

        ExportService sut = new ExportService(scope.Tickets, scope.Projects, scope.Users, scope.Suppressions,
            TestLocalizer.Create(), NullLogger<ExportService>.Instance);

        ExportResult export = await sut.ExportTicketsExcelAsync(scope.OrganizationId, new TicketFilter(),
            scope.UserId, TestContext.Current.CancellationToken);

        using XLWorkbook workbook = new XLWorkbook(new MemoryStream(export.Content));
        IXLWorksheet sheet = workbook.Worksheet(1);

        new[] { sheet.Cell(FirstDataRow, 1).GetString(), sheet.Cell(FirstDataRow + 1, 1).GetString() }
            .Should().BeEquivalentTo("TKT-000007", "TKT-000042");
        sheet.Cell(FirstDataRow + 1, 3).Style.Border.TopBorder.Should().Be(XLBorderStyleValues.Thin);
        sheet.Cell(FirstDataRow + 1, 3).Style.Alignment.Vertical.Should().Be(XLAlignmentVerticalValues.Center);
    }
}
