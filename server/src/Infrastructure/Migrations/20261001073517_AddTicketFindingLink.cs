using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketFindingLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AutoResolvedAt",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FindingKey",
                table: "Tickets",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FindingKind",
                table: "Tickets",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "TicketHistories",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_ProjectId_FindingKind_FindingKey",
                table: "Tickets",
                columns: new[] { "ProjectId", "FindingKind", "FindingKey" },
                unique: true,
                filter: "\"FindingKey\" IS NOT NULL AND \"Status\" IN ('New', 'InProgress', 'Testing')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_ProjectId_FindingKind_FindingKey",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "AutoResolvedAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "FindingKey",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "FindingKind",
                table: "Tickets");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "TicketHistories",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
