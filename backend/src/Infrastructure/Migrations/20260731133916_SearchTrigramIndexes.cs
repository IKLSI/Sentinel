using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SearchTrigramIndexes : Migration
    {
        private static readonly (string Name, string Table, string Column)[] TrigramIndexes =
        {
            ("IX_Tickets_Title_Trgm", "Tickets", "Title"),
            ("IX_Tickets_Description_Trgm", "Tickets", "Description"),
            ("IX_TicketComments_Content_Trgm", "TicketComments", "Content"),
            ("IX_Users_FirstName_Trgm", "Users", "FirstName"),
            ("IX_Users_LastName_Trgm", "Users", "LastName"),
            ("IX_Users_Email_Trgm", "Users", "Email"),
        };

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            foreach ((string name, string table, string column) in TrigramIndexes)
            {
                migrationBuilder.Sql(
                    $"CREATE INDEX IF NOT EXISTS \"{name}\" ON \"{table}\" USING gin (\"{column}\" gin_trgm_ops);");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach ((string name, string _, string _) in TrigramIndexes)
            {
                migrationBuilder.Sql($"DROP INDEX IF EXISTS \"{name}\";");
            }
        }
    }
}
