using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RowLevelSecurityAndSearchIndexes : Migration
    {
        private const string CurrentOrg = "current_setting('app.current_org', true)";

        private static readonly (string Table, string Match)[] TenantTables =
        {
            ("Organizations", $"\"Id\"::text = {CurrentOrg}"),
            ("Users", $"\"OrganizationId\"::text = {CurrentOrg}"),
            ("UserInvitations", $"\"OrganizationId\"::text = {CurrentOrg}"),
            ("Tickets", $"\"OrganizationId\"::text = {CurrentOrg}"),
            ("Projects", $"\"OrganizationId\"::text = {CurrentOrg}"),
            ("AuditLogs", $"\"OrganizationId\"::text = {CurrentOrg}"),
            ("ApiKeys", $"\"OrganizationId\"::text = {CurrentOrg}"),
            (
                "TicketComments",
                $"\"TicketId\" IN (SELECT t.\"Id\" FROM \"Tickets\" t WHERE t.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "TicketHistories",
                $"\"TicketId\" IN (SELECT t.\"Id\" FROM \"Tickets\" t WHERE t.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "TicketAttachments",
                $"\"TicketId\" IN (SELECT t.\"Id\" FROM \"Tickets\" t WHERE t.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "Dependencies",
                $"\"ProjectId\" IN (SELECT p.\"Id\" FROM \"Projects\" p WHERE p.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "Runtimes",
                $"\"ProjectId\" IN (SELECT p.\"Id\" FROM \"Projects\" p WHERE p.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "Vulnerabilities",
                $"\"DependencyId\" IN (SELECT d.\"Id\" FROM \"Dependencies\" d JOIN \"Projects\" p ON p.\"Id\" = d.\"ProjectId\" WHERE p.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "PasswordResetTokens",
                $"\"UserId\" IN (SELECT u.\"Id\" FROM \"Users\" u WHERE u.\"OrganizationId\"::text = {CurrentOrg})"
            ),
            (
                "EmailVerificationTokens",
                $"\"UserId\" IN (SELECT u.\"Id\" FROM \"Users\" u WHERE u.\"OrganizationId\"::text = {CurrentOrg})"
            ),
        };

        private static readonly (string Name, string Table, string Column)[] TrigramIndexes =
        {
            ("IX_Tickets_Title_Trgm", "Tickets", "Title"),
            ("IX_Tickets_Description_Trgm", "Tickets", "Description"),
            ("IX_TicketComments_Content_Trgm", "TicketComments", "Content"),
            ("IX_Users_FirstName_Trgm", "Users", "FirstName"),
            ("IX_Users_LastName_Trgm", "Users", "LastName"),
            ("IX_Users_Email_Trgm", "Users", "Email"),
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
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            foreach ((string name, string table, string column) in TrigramIndexes)
            {
                migrationBuilder.Sql(
                    $"CREATE INDEX IF NOT EXISTS \"{name}\" ON \"{table}\" USING gin (\"{column}\" gin_trgm_ops);");
            }

            foreach ((string table, string match) in TenantTables)
            {
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" ENABLE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql(FailClosedPolicy(table, match));
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach ((string table, string _) in TenantTables)
            {
                migrationBuilder.Sql($"DROP POLICY IF EXISTS tenant_isolation ON \"{table}\";");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" NO FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE \"{table}\" DISABLE ROW LEVEL SECURITY;");
            }

            foreach ((string name, string _, string _) in TrigramIndexes)
            {
                migrationBuilder.Sql($"DROP INDEX IF EXISTS \"{name}\";");
            }
        }
    }
}
