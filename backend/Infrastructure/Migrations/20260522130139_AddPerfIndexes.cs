using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerfIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Vulnerabilities_Severity_DependencyId",
                table: "Vulnerabilities",
                columns: new[] { "Severity", "DependencyId" });

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_UserId_Date",
                table: "TimeEntries",
                columns: new[] { "UserId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId_CreatedAt",
                table: "Tickets",
                columns: new[] { "OrganizationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId_TicketStatusId",
                table: "Tickets",
                columns: new[] { "OrganizationId", "TicketStatusId" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId_UpdatedAt",
                table: "Tickets",
                columns: new[] { "OrganizationId", "UpdatedAt" });

            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_TicketComments_Content_trgm""
                ON ""TicketComments""
                USING gin (""Content"" gin_trgm_ops);
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_Tickets_Title_trgm""
                ON ""Tickets""
                USING gin (""Title"" gin_trgm_ops);
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_Tickets_Description_trgm""
                ON ""Tickets""
                USING gin (""Description"" gin_trgm_ops);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_TicketComments_Content_trgm"";");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Tickets_Title_trgm"";");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Tickets_Description_trgm"";");

            migrationBuilder.DropIndex(
                name: "IX_Vulnerabilities_Severity_DependencyId",
                table: "Vulnerabilities");

            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_UserId_Date",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_OrganizationId_CreatedAt",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_OrganizationId_TicketStatusId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_OrganizationId_UpdatedAt",
                table: "Tickets");
        }
    }
}
