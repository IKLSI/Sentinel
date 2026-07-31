using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DecorrelateIndirectRlsPolicies : Migration
    {
        private const string CurrentOrg = "current_setting('app.current_org', true)";

        private static readonly (string Table, string Decorrelated, string Correlated)[] IndirectTenantTables =
        {
            (
                "TicketComments",
                $"\"TicketId\" IN (SELECT t.\"Id\" FROM \"Tickets\" t WHERE t.\"OrganizationId\"::text = {CurrentOrg})",
                $"EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TicketComments\".\"TicketId\" AND t.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "TicketHistories",
                $"\"TicketId\" IN (SELECT t.\"Id\" FROM \"Tickets\" t WHERE t.\"OrganizationId\"::text = {CurrentOrg})",
                $"EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TicketHistories\".\"TicketId\" AND t.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "TicketAttachments",
                $"\"TicketId\" IN (SELECT t.\"Id\" FROM \"Tickets\" t WHERE t.\"OrganizationId\"::text = {CurrentOrg})",
                $"EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TicketAttachments\".\"TicketId\" AND t.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "Dependencies",
                $"\"ProjectId\" IN (SELECT p.\"Id\" FROM \"Projects\" p WHERE p.\"OrganizationId\"::text = {CurrentOrg})",
                $"EXISTS (SELECT 1 FROM \"Projects\" p WHERE p.\"Id\" = \"Dependencies\".\"ProjectId\" AND p.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "Runtimes",
                $"\"ProjectId\" IN (SELECT p.\"Id\" FROM \"Projects\" p WHERE p.\"OrganizationId\"::text = {CurrentOrg})",
                $"EXISTS (SELECT 1 FROM \"Projects\" p WHERE p.\"Id\" = \"Runtimes\".\"ProjectId\" AND p.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "Vulnerabilities",
                $"\"DependencyId\" IN (SELECT d.\"Id\" FROM \"Dependencies\" d JOIN \"Projects\" p ON p.\"Id\" = d.\"ProjectId\" WHERE p.\"OrganizationId\"::text = {CurrentOrg})",
                $"EXISTS (SELECT 1 FROM \"Dependencies\" d JOIN \"Projects\" p ON p.\"Id\" = d.\"ProjectId\" WHERE d.\"Id\" = \"Vulnerabilities\".\"DependencyId\" AND p.\"OrganizationId\"::text = {CurrentOrg})"
            ),
        };

        private static string FailClosedPolicy(string table, string match) => $@"
DROP POLICY IF EXISTS tenant_isolation ON ""{table}"";
CREATE POLICY tenant_isolation ON ""{table}""
USING (
    {CurrentOrg} = 'system'
    OR (
        {CurrentOrg} <> ''
        AND {CurrentOrg} IS NOT NULL
        AND ({match})
    )
);";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, string decorrelated, _) in IndirectTenantTables)
            {
                migrationBuilder.Sql(FailClosedPolicy(table, decorrelated));
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, _, string correlated) in IndirectTenantTables)
            {
                migrationBuilder.Sql(FailClosedPolicy(table, correlated));
            }
        }
    }
}
