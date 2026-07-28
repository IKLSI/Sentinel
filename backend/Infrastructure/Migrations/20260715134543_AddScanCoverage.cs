using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScanCoverage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "HealthScore",
                table: "Projects",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "HealthGrade",
                table: "Projects",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2)",
                oldMaxLength: 2);

            migrationBuilder.AddColumn<string>(
                name: "Coverage",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "NotScanned");

            migrationBuilder.Sql("""
                UPDATE "Projects" p
                SET "Coverage" = CASE
                    WHEN p."LastScanAt" IS NULL THEN 'NotScanned'
                    WHEN EXISTS (SELECT 1 FROM "Dependencies" d WHERE d."ProjectId" = p."Id")
                      OR EXISTS (SELECT 1 FROM "Runtimes" r WHERE r."ProjectId" = p."Id") THEN 'Covered'
                    WHEN p."LastScanError" IS NOT NULL THEN 'Failed'
                    ELSE 'NoManifest'
                END;
                """);

            migrationBuilder.Sql("""
                UPDATE "Projects"
                SET "HealthScore" = NULL, "HealthGrade" = NULL
                WHERE "Coverage" <> 'Covered';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Coverage",
                table: "Projects");

            migrationBuilder.AlterColumn<int>(
                name: "HealthScore",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "HealthGrade",
                table: "Projects",
                type: "character varying(2)",
                maxLength: 2,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(2)",
                oldMaxLength: 2,
                oldNullable: true);
        }
    }
}
