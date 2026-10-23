using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectLastReliableScanAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastReliableScanAt",
                table: "Projects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("SELECT set_config('app.current_org', 'system', true);");

            migrationBuilder.Sql("""
                UPDATE "Projects"
                SET "LastReliableScanAt" = "LastScanAt"
                WHERE "Coverage" = 'Covered' AND "LastScanError" IS NULL AND "LastScanAt" IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastReliableScanAt",
                table: "Projects");
        }
    }
}
