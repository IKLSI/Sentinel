using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRlsNotificationsApiKeys : Migration
    {
        private static readonly (string Table, string OrgExpression)[] DirectTenantTables =
        {
            ("Notifications", "\"OrganizationId\"::text"),
            ("ApiKeys", "\"OrganizationId\"::text"),
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

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, string orgExpr) in DirectTenantTables)
            {
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" ENABLE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql(FailClosedPolicy(table, $"{orgExpr} = current_setting('app.current_org', true)"));
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, string orgExpr) in DirectTenantTables)
            {
                migrationBuilder.Sql(FailOpenPolicy(table, $"{orgExpr} = current_setting('app.current_org', true)"));
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" DISABLE ROW LEVEL SECURITY;");
            }
        }
    }
}
