using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TicketSequentialNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Number",
                table: "Tickets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TicketCounter",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
                WITH numbered AS (
                    SELECT "Id",
                           row_number() OVER (PARTITION BY "OrganizationId" ORDER BY "CreatedAt", "Id") AS "Rank"
                    FROM "Tickets"
                )
                UPDATE "Tickets" AS t
                SET "Number" = n."Rank"
                FROM numbered AS n
                WHERE t."Id" = n."Id";
                """);

            migrationBuilder.Sql(
                """
                UPDATE "Organizations" AS o
                SET "TicketCounter" = COALESCE(
                    (SELECT MAX(t."Number") FROM "Tickets" AS t WHERE t."OrganizationId" = o."Id"), 0);
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId_Number",
                table: "Tickets",
                columns: new[] { "OrganizationId", "Number" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_OrganizationId_Number",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "Number",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "TicketCounter",
                table: "Organizations");
        }
    }
}
