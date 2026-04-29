using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSlaFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_SlaBreached",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "SlaBreached",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "SlaDeadline",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "SlaWarningNotifiedAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "SlaCriticalHours",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "SlaHighHours",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "SlaLowHours",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "SlaMediumHours",
                table: "Organizations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "SlaBreached",
                table: "Tickets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "SlaDeadline",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SlaWarningNotifiedAt",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SlaCriticalHours",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 4);

            migrationBuilder.AddColumn<int>(
                name: "SlaHighHours",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 8);

            migrationBuilder.AddColumn<int>(
                name: "SlaLowHours",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 48);

            migrationBuilder.AddColumn<int>(
                name: "SlaMediumHours",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 24);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_SlaBreached",
                table: "Tickets",
                column: "SlaBreached");
        }
    }
}
