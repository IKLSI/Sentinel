using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectInventoryCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_CriticalVulnerabilities",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_Dependencies",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_DeprecatedDependencies",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_HighVulnerabilities",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_KnownExploitedVulnerabilities",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_LowVulnerabilities",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_MajorUpdates",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_MajorUpdatesInProduction",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_MediumVulnerabilities",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_MinorUpdates",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_UpToDateDependencies",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_Vulnerabilities",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InventoryCounts_VulnerableDependencies",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("SELECT set_config('app.current_org', 'system', true);");

            migrationBuilder.Sql("""
                UPDATE "Projects" p
                SET "InventoryCounts_Dependencies" = d."Total",
                    "InventoryCounts_UpToDateDependencies" = d."UpToDate",
                    "InventoryCounts_MinorUpdates" = d."Minor",
                    "InventoryCounts_MajorUpdates" = d."Major",
                    "InventoryCounts_MajorUpdatesInProduction" = d."MajorInProduction",
                    "InventoryCounts_DeprecatedDependencies" = d."Deprecated",
                    "InventoryCounts_VulnerableDependencies" = d."Vulnerable"
                FROM (
                    SELECT "ProjectId",
                           COUNT(*) AS "Total",
                           COUNT(*) FILTER (WHERE "Status" = 'UpToDate') AS "UpToDate",
                           COUNT(*) FILTER (WHERE "Status" = 'MinorUpdate') AS "Minor",
                           COUNT(*) FILTER (WHERE "Status" = 'MajorUpdate') AS "Major",
                           COUNT(*) FILTER (WHERE "Status" = 'MajorUpdate' AND "IsDirect" AND "Type" = 'Prod')
                               AS "MajorInProduction",
                           COUNT(*) FILTER (WHERE "IsDeprecated") AS "Deprecated",
                           COUNT(*) FILTER (WHERE "Status" = 'Vulnerable') AS "Vulnerable"
                    FROM "Dependencies"
                    GROUP BY "ProjectId"
                ) d
                WHERE d."ProjectId" = p."Id";
                """);

            migrationBuilder.Sql("""
                UPDATE "Projects" p
                SET "InventoryCounts_Vulnerabilities" = v."Total",
                    "InventoryCounts_CriticalVulnerabilities" = v."Critical",
                    "InventoryCounts_HighVulnerabilities" = v."High",
                    "InventoryCounts_MediumVulnerabilities" = v."Medium",
                    "InventoryCounts_LowVulnerabilities" = v."Low",
                    "InventoryCounts_KnownExploitedVulnerabilities" = v."KnownExploited"
                FROM (
                    SELECT d."ProjectId",
                           COUNT(*) AS "Total",
                           COUNT(*) FILTER (WHERE vu."Severity" = 'Critical') AS "Critical",
                           COUNT(*) FILTER (WHERE vu."Severity" = 'High') AS "High",
                           COUNT(*) FILTER (WHERE vu."Severity" = 'Medium') AS "Medium",
                           COUNT(*) FILTER (WHERE vu."Severity" = 'Low') AS "Low",
                           COUNT(*) FILTER (WHERE vu."IsKnownExploited") AS "KnownExploited"
                    FROM "Vulnerabilities" vu
                    JOIN "Dependencies" d ON d."Id" = vu."DependencyId"
                    GROUP BY d."ProjectId"
                ) v
                WHERE v."ProjectId" = p."Id";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InventoryCounts_CriticalVulnerabilities",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_Dependencies",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_DeprecatedDependencies",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_HighVulnerabilities",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_KnownExploitedVulnerabilities",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_LowVulnerabilities",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_MajorUpdates",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_MajorUpdatesInProduction",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_MediumVulnerabilities",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_MinorUpdates",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_UpToDateDependencies",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_Vulnerabilities",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InventoryCounts_VulnerableDependencies",
                table: "Projects");
        }
    }
}
