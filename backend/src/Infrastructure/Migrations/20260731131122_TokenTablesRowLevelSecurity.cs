using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TokenTablesRowLevelSecurity : Migration
    {
        private const string CurrentOrg = "current_setting('app.current_org', true)";

        private static readonly (string Table, string Match)[] UserScopedTables =
        {
            (
                "PasswordResetTokens",
                $"\"UserId\" IN (SELECT u.\"Id\" FROM \"Users\" u WHERE u.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "EmailVerificationTokens",
                $"\"UserId\" IN (SELECT u.\"Id\" FROM \"Users\" u WHERE u.\"OrganizationId\"::text = {CurrentOrg})"
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
            foreach ((string table, string match) in UserScopedTables)
            {
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" ENABLE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql(FailClosedPolicy(table, match));
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, string _) in UserScopedTables)
            {
                migrationBuilder.Sql($"DROP POLICY IF EXISTS tenant_isolation ON \"{table}\";");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" NO FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" DISABLE ROW LEVEL SECURITY;");
            }
        }
    }
}
