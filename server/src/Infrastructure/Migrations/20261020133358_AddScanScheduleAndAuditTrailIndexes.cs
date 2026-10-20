using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScanScheduleAndAuditTrailIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_EntityType_EntityId",
                table: "AuditLogs");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ScanFrequency_LastScanAt",
                table: "Projects",
                columns: new[] { "ScanFrequency", "LastScanAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityType_EntityId_CreatedAt",
                table: "AuditLogs",
                columns: new[] { "EntityType", "EntityId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Projects_ScanFrequency_LastScanAt",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_EntityType_EntityId_CreatedAt",
                table: "AuditLogs");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityType_EntityId",
                table: "AuditLogs",
                columns: new[] { "EntityType", "EntityId" });
        }
    }
}
