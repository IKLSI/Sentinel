using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TicketPriorityRank : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PriorityRank",
                table: "Tickets",
                type: "integer",
                nullable: false,
                computedColumnSql: "CASE \"Priority\" WHEN 'Critical' THEN 4 WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 ELSE 1 END",
                stored: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId_Status_PriorityRank_CreatedAt",
                table: "Tickets",
                columns: new[] { "OrganizationId", "Status", "PriorityRank", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_OrganizationId_Status_PriorityRank_CreatedAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "PriorityRank",
                table: "Tickets");
        }
    }
}
