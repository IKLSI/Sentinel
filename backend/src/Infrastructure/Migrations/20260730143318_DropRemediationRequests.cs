using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropRemediationRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RemediationRequests");

            migrationBuilder.Sql("DELETE FROM \"AuditLogs\" WHERE \"Action\" = 'RemediationRequested';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RemediationRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    BranchName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    DependenciesPatched = table.Column<int>(type: "integer", nullable: false),
                    Error = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    HasBreakingChanges = table.Column<bool>(type: "boolean", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    PullRequestUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TargetsJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RemediationRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RemediationRequests_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RemediationRequests_ActiveProject",
                table: "RemediationRequests",
                column: "ProjectId",
                unique: true,
                filter: "\"Status\" IN ('Pending', 'PullRequestOpen')");

            migrationBuilder.CreateIndex(
                name: "IX_RemediationRequests_OrganizationId",
                table: "RemediationRequests",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_RemediationRequests_ProjectId_Status",
                table: "RemediationRequests",
                columns: new[] { "ProjectId", "Status" });
        }
    }
}
