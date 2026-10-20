using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardHealthHistory : Migration
    {
        private static readonly string[] TenantTables = { "ProjectHealthSnapshots", "VulnerabilityResolutions" };

        private const string SeedTodaySnapshots = """
INSERT INTO "ProjectHealthSnapshots" ("Id", "OrganizationId", "ProjectId", "Day", "Score", "Grade")
SELECT gen_random_uuid(), "OrganizationId", "Id", CURRENT_DATE, "HealthScore", "HealthGrade"
FROM "Projects"
WHERE "HealthScore" IS NOT NULL AND "HealthGrade" IS NOT NULL;
""";

        private static string TenantPolicy(string table) => $@"
DROP POLICY IF EXISTS tenant_isolation ON ""{table}"";
CREATE POLICY tenant_isolation ON ""{table}""
USING (
    (SELECT current_setting('app.current_org', true) = 'system')
    OR (""OrganizationId"" = (SELECT app_current_org()))
);";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProjectHealthSnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    Day = table.Column<DateOnly>(type: "date", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Grade = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectHealthSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectHealthSnapshots_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VulnerabilityResolutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    CveId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VulnerabilityResolutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VulnerabilityResolutions_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectHealthSnapshots_OrganizationId_Day",
                table: "ProjectHealthSnapshots",
                columns: new[] { "OrganizationId", "Day" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectHealthSnapshots_ProjectId_Day",
                table: "ProjectHealthSnapshots",
                columns: new[] { "ProjectId", "Day" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VulnerabilityResolutions_OrganizationId_DetectedAt",
                table: "VulnerabilityResolutions",
                columns: new[] { "OrganizationId", "DetectedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_VulnerabilityResolutions_OrganizationId_ResolvedAt",
                table: "VulnerabilityResolutions",
                columns: new[] { "OrganizationId", "ResolvedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_VulnerabilityResolutions_ProjectId",
                table: "VulnerabilityResolutions",
                column: "ProjectId");

            migrationBuilder.Sql(SeedTodaySnapshots);

            foreach (string table in TenantTables)
            {
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" ENABLE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql(TenantPolicy(table));
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectHealthSnapshots");

            migrationBuilder.DropTable(
                name: "VulnerabilityResolutions");
        }
    }
}
