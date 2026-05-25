using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    public partial class PerformanceAndSecurity : Migration
    {
        private static readonly (string Table, string OrgExpression)[] DirectTenantTables =
        {
            ("Organizations", "\"Id\"::text"),
            ("Users", "\"OrganizationId\"::text"),
            ("UserInvitations", "\"OrganizationId\"::text"),
            ("TicketStatuses", "\"OrganizationId\"::text"),
            ("Tickets", "\"OrganizationId\"::text"),
            ("Projects", "\"OrganizationId\"::text"),
            ("AuditLogs", "\"OrganizationId\"::text"),
        };

        private static readonly (string Table, string Subquery)[] IndirectTenantTables =
        {
            ("TicketComments", "EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TicketComments\".\"TicketId\" AND t.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("TicketHistories", "EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TicketHistories\".\"TicketId\" AND t.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("TicketAttachments", "EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TicketAttachments\".\"TicketId\" AND t.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("TimeEntries", "(\"TicketId\" IS NULL OR EXISTS (SELECT 1 FROM \"Tickets\" t WHERE t.\"Id\" = \"TimeEntries\".\"TicketId\" AND t.\"OrganizationId\"::text = current_setting('app.current_org', true))) AND (\"ProjectId\" IS NULL OR EXISTS (SELECT 1 FROM \"Projects\" p WHERE p.\"Id\" = \"TimeEntries\".\"ProjectId\" AND p.\"OrganizationId\"::text = current_setting('app.current_org', true)))"),
            ("Dependencies", "EXISTS (SELECT 1 FROM \"Projects\" p WHERE p.\"Id\" = \"Dependencies\".\"ProjectId\" AND p.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("Runtimes", "EXISTS (SELECT 1 FROM \"Projects\" p WHERE p.\"Id\" = \"Runtimes\".\"ProjectId\" AND p.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
            ("Vulnerabilities", "EXISTS (SELECT 1 FROM \"Dependencies\" d JOIN \"Projects\" p ON p.\"Id\" = d.\"ProjectId\" WHERE d.\"Id\" = \"Vulnerabilities\".\"DependencyId\" AND p.\"OrganizationId\"::text = current_setting('app.current_org', true))"),
        };

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

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_Tickets_Title_trgm""
                ON ""Tickets""
                USING gin (""Title"" gin_trgm_ops);
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_Tickets_Description_trgm""
                ON ""Tickets""
                USING gin (""Description"" gin_trgm_ops);
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_TicketComments_Content_trgm""
                ON ""TicketComments""
                USING gin (""Content"" gin_trgm_ops);
            ");

            foreach ((string table, string orgExpr) in DirectTenantTables)
            {
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" ENABLE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql(FailClosedPolicy(table, $"{orgExpr} = current_setting('app.current_org', true)"));
            }

            foreach ((string table, string subquery) in IndirectTenantTables)
            {
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" ENABLE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql(FailClosedPolicy(table, subquery));
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, string orgExpr) in DirectTenantTables)
            {
                migrationBuilder.Sql(FailOpenPolicy(table, $"{orgExpr} = current_setting('app.current_org', true)"));
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" DISABLE ROW LEVEL SECURITY;");
            }

            foreach ((string table, string subquery) in IndirectTenantTables)
            {
                migrationBuilder.Sql(FailOpenPolicy(table, subquery));
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" DISABLE ROW LEVEL SECURITY;");
            }

            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_TicketComments_Content_trgm"";");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Tickets_Description_trgm"";");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Tickets_Title_trgm"";");
        }
    }
}
