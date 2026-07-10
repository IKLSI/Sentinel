using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRemediationRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RemediationRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PullRequestUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BranchName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DependenciesPatched = table.Column<int>(type: "integer", nullable: false),
                    HasBreakingChanges = table.Column<bool>(type: "boolean", nullable: false),
                    TargetsJson = table.Column<string>(type: "text", nullable: true),
                    Error = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
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
                name: "IX_RemediationRequests_OrganizationId",
                table: "RemediationRequests",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_RemediationRequests_ProjectId_Status",
                table: "RemediationRequests",
                columns: new[] { "ProjectId", "Status" });

            migrationBuilder.Sql("ALTER TABLE \"RemediationRequests\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE \"RemediationRequests\" FORCE ROW LEVEL SECURITY;");
            migrationBuilder.Sql(@"
DROP POLICY IF EXISTS tenant_isolation ON ""RemediationRequests"";
CREATE POLICY tenant_isolation ON ""RemediationRequests""
USING (
    current_setting('app.current_org', true) = 'system'
    OR (
        current_setting('app.current_org', true) <> ''
        AND current_setting('app.current_org', true) IS NOT NULL
        AND ""OrganizationId""::text = current_setting('app.current_org', true)
    )
);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP POLICY IF EXISTS tenant_isolation ON \"RemediationRequests\";");
            migrationBuilder.DropTable(
                name: "RemediationRequests");
        }
    }
}
