using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DenormalizeInventoryOrganization : Migration
    {
        private const string CurrentOrgId = "(SELECT app_current_org())";

        private const string BackfillOrganizationIds = """
UPDATE "Dependencies" d SET "OrganizationId" = p."OrganizationId" FROM "Projects" p WHERE p."Id" = d."ProjectId";
UPDATE "Runtimes" r SET "OrganizationId" = p."OrganizationId" FROM "Projects" p WHERE p."Id" = r."ProjectId";
UPDATE "Vulnerabilities" v SET "OrganizationId" = d."OrganizationId" FROM "Dependencies" d WHERE d."Id" = v."DependencyId";
""";

        private static readonly string[] DenormalizedTables = { "Dependencies", "Runtimes", "Vulnerabilities" };

        private static readonly (string Table, string Match)[] JoinedTenantPolicies =
        {
            (
                "Dependencies",
                $"EXISTS (SELECT 1 FROM \"Projects\" p WHERE p.\"Id\" = \"Dependencies\".\"ProjectId\" AND p.\"OrganizationId\" = {CurrentOrgId})"
            ),
            (
                "Runtimes",
                $"EXISTS (SELECT 1 FROM \"Projects\" p WHERE p.\"Id\" = \"Runtimes\".\"ProjectId\" AND p.\"OrganizationId\" = {CurrentOrgId})"
            ),
            (
                "Vulnerabilities",
                $"EXISTS (SELECT 1 FROM \"Dependencies\" d JOIN \"Projects\" p ON p.\"Id\" = d.\"ProjectId\" WHERE d.\"Id\" = \"Vulnerabilities\".\"DependencyId\" AND p.\"OrganizationId\" = {CurrentOrgId})"
            ),
        };

        private static string TenantPolicy(string table, string match) => $@"
DROP POLICY IF EXISTS tenant_isolation ON ""{table}"";
CREATE POLICY tenant_isolation ON ""{table}""
USING (
    (SELECT current_setting('app.current_org', true) = 'system')
    OR ({match})
);";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Dependencies_Projects_ProjectId",
                table: "Dependencies");

            migrationBuilder.DropForeignKey(
                name: "FK_Runtimes_Projects_ProjectId",
                table: "Runtimes");

            migrationBuilder.DropForeignKey(
                name: "FK_Vulnerabilities_Dependencies_DependencyId",
                table: "Vulnerabilities");

            migrationBuilder.DropIndex(
                name: "IX_Vulnerabilities_DependencyId",
                table: "Vulnerabilities");

            migrationBuilder.DropIndex(
                name: "IX_Runtimes_ProjectId",
                table: "Runtimes");

            migrationBuilder.DropIndex(
                name: "IX_Dependencies_ProjectId",
                table: "Dependencies");

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                table: "Vulnerabilities",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                table: "Runtimes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                table: "Dependencies",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.Sql(BackfillOrganizationIds);

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Projects_Id_OrganizationId",
                table: "Projects",
                columns: new[] { "Id", "OrganizationId" });

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Dependencies_Id_OrganizationId",
                table: "Dependencies",
                columns: new[] { "Id", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_Vulnerabilities_DependencyId_OrganizationId",
                table: "Vulnerabilities",
                columns: new[] { "DependencyId", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_Vulnerabilities_OrganizationId_Severity",
                table: "Vulnerabilities",
                columns: new[] { "OrganizationId", "Severity" });

            migrationBuilder.CreateIndex(
                name: "IX_Runtimes_OrganizationId",
                table: "Runtimes",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Runtimes_ProjectId_OrganizationId",
                table: "Runtimes",
                columns: new[] { "ProjectId", "OrganizationId" });

            migrationBuilder.CreateIndex(
                name: "IX_Dependencies_OrganizationId",
                table: "Dependencies",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Dependencies_ProjectId_OrganizationId",
                table: "Dependencies",
                columns: new[] { "ProjectId", "OrganizationId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Dependencies_Projects_ProjectId_OrganizationId",
                table: "Dependencies",
                columns: new[] { "ProjectId", "OrganizationId" },
                principalTable: "Projects",
                principalColumns: new[] { "Id", "OrganizationId" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Runtimes_Projects_ProjectId_OrganizationId",
                table: "Runtimes",
                columns: new[] { "ProjectId", "OrganizationId" },
                principalTable: "Projects",
                principalColumns: new[] { "Id", "OrganizationId" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vulnerabilities_Dependencies_DependencyId_OrganizationId",
                table: "Vulnerabilities",
                columns: new[] { "DependencyId", "OrganizationId" },
                principalTable: "Dependencies",
                principalColumns: new[] { "Id", "OrganizationId" },
                onDelete: ReferentialAction.Cascade);

            foreach (string table in DenormalizedTables)
            {
                migrationBuilder.Sql(TenantPolicy(table, $"\"OrganizationId\" = {CurrentOrgId}"));
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, string match) in JoinedTenantPolicies)
            {
                migrationBuilder.Sql(TenantPolicy(table, match));
            }

            migrationBuilder.DropForeignKey(
                name: "FK_Dependencies_Projects_ProjectId_OrganizationId",
                table: "Dependencies");

            migrationBuilder.DropForeignKey(
                name: "FK_Runtimes_Projects_ProjectId_OrganizationId",
                table: "Runtimes");

            migrationBuilder.DropForeignKey(
                name: "FK_Vulnerabilities_Dependencies_DependencyId_OrganizationId",
                table: "Vulnerabilities");

            migrationBuilder.DropIndex(
                name: "IX_Vulnerabilities_DependencyId_OrganizationId",
                table: "Vulnerabilities");

            migrationBuilder.DropIndex(
                name: "IX_Vulnerabilities_OrganizationId_Severity",
                table: "Vulnerabilities");

            migrationBuilder.DropIndex(
                name: "IX_Runtimes_OrganizationId",
                table: "Runtimes");

            migrationBuilder.DropIndex(
                name: "IX_Runtimes_ProjectId_OrganizationId",
                table: "Runtimes");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Projects_Id_OrganizationId",
                table: "Projects");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Dependencies_Id_OrganizationId",
                table: "Dependencies");

            migrationBuilder.DropIndex(
                name: "IX_Dependencies_OrganizationId",
                table: "Dependencies");

            migrationBuilder.DropIndex(
                name: "IX_Dependencies_ProjectId_OrganizationId",
                table: "Dependencies");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Vulnerabilities");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Runtimes");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Dependencies");

            migrationBuilder.CreateIndex(
                name: "IX_Vulnerabilities_DependencyId",
                table: "Vulnerabilities",
                column: "DependencyId");

            migrationBuilder.CreateIndex(
                name: "IX_Runtimes_ProjectId",
                table: "Runtimes",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Dependencies_ProjectId",
                table: "Dependencies",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Dependencies_Projects_ProjectId",
                table: "Dependencies",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Runtimes_Projects_ProjectId",
                table: "Runtimes",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vulnerabilities_Dependencies_DependencyId",
                table: "Vulnerabilities",
                column: "DependencyId",
                principalTable: "Dependencies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
