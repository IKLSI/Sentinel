using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RlsFailClosed : Migration
    {
        private static readonly (string Table, string OrgExpression)[] DirectTenantTables =
        {
            ("Organizations", "\"Id\"::text"),
            ("Users", "\"OrganizationId\"::text"),
            ("UserInvitations", "\"OrganizationId\"::text"),
            ("TicketStatuses", "\"OrganizationId\"::text"),
            ("Tickets", "\"OrganizationId\"::text"),
            ("TechProjects", "\"OrganizationId\"::text"),
            ("AuditLogs", "\"OrganizationId\"::text"),
        };

        private static readonly (string Table, string Subquery)[] IndirectTenantTables =
        {
            ("TicketComments", "EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TicketComments\".\"TicketId\" AND t.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("TicketHistories", "EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TicketHistories\".\"TicketId\" AND t.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("TicketAttachments", "EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TicketAttachments\".\"TicketId\" AND t.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("TimeEntries", "(\"TicketId\" IS NULL OR EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TimeEntries\".\"TicketId\" AND t.\"OrganizationId\"::text = current_setting('app.current_org', true))) AND (\"TechProjectId\" IS NULL OR EXISTS (SELECT 1 FROM \"TechProjects\" p WHERE p.\"Id\" = \"TimeEntries\".\"TechProjectId\" AND p.\"OrganizationId\"::text = current_setting('app.current_org', true)))"),
            ("Dependencies", "EXISTS (SELECT 1 FROM \"TechProjects\" p WHERE p.\"Id\" = \"Dependencies\".\"TechProjectId\" AND p.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("Runtimes", "EXISTS (SELECT 1 FROM \"TechProjects\" p WHERE p.\"Id\" = \"Runtimes\".\"TechProjectId\" AND p.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("Vulnerabilities", "EXISTS (SELECT 1 FROM \"Dependencies\" d JOIN \"TechProjects\" p ON p.\"Id\" = d.\"TechProjectId\" WHERE d.\"Id\" = \"Vulnerabilities\".\"DependencyId\" AND p.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
        };

        private static string DirectMatch(string orgExpr) =>
            $"{orgExpr} = current_setting('app.current_org', true)";

        private static string FailClosedPolicy(string table, string match) => $@"
DROP POLICY IF EXISTS tenant_isolation ON ""{table}"";
CREATE POLICY tenant_isolation ON ""{table}""
USING (
    current_setting('app.current_org', true) = 'system'
    OR (
        current_setting('app.current_org', true) <> ''
        AND current_setting('app.current_org', true) IS NOT NULL
        AND ({match})
    )
);";

        private static string FailOpenPolicy(string table, string match) => $@"
DROP POLICY IF EXISTS tenant_isolation ON ""{table}"";
CREATE POLICY tenant_isolation ON ""{table}""
USING (
    current_setting('app.current_org', true) = ''
    OR current_setting('app.current_org', true) IS NULL
    OR ({match})
);";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, string orgExpr) in DirectTenantTables)
            {
                migrationBuilder.Sql(FailClosedPolicy(table, DirectMatch(orgExpr)));
            }

            foreach ((string table, string subquery) in IndirectTenantTables)
            {
                migrationBuilder.Sql(FailClosedPolicy(table, subquery));
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, string orgExpr) in DirectTenantTables)
            {
                migrationBuilder.Sql(FailOpenPolicy(table, DirectMatch(orgExpr)));
            }

            foreach ((string table, string subquery) in IndirectTenantTables)
            {
                migrationBuilder.Sql(FailOpenPolicy(table, subquery));
            }
        }
    }
}
