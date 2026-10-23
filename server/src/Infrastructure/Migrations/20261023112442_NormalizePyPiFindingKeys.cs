using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizePyPiFindingKeys : Migration
    {
        private const string OpenTicketStatuses = "('New', 'InProgress', 'Testing')";

        private static string Normalized(string column) =>
            $"'pypi:' || regexp_replace(split_part({column}, ':', 2), '[-_.]+', '-', 'g') || " +
            $"coalesce(substring({column} from '^pypi:[^:]*(:.*)$'), '')";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("SELECT set_config('app.current_org', 'system', true);");

            migrationBuilder.Sql($"""
                DELETE FROM "VulnerabilitySuppressions" s
                USING "VulnerabilitySuppressions" other
                WHERE s."FindingKey" LIKE 'pypi:%'
                  AND other."FindingKey" LIKE 'pypi:%'
                  AND s."ProjectId" = other."ProjectId"
                  AND s."Id" <> other."Id"
                  AND {Normalized("s.\"FindingKey\"")} = {Normalized("other.\"FindingKey\"")}
                  AND (s."CreatedAt", s."Id") < (other."CreatedAt", other."Id");
                """);

            migrationBuilder.Sql($"""
                UPDATE "VulnerabilitySuppressions"
                SET "FindingKey" = {Normalized("\"FindingKey\"")}
                WHERE "FindingKey" LIKE 'pypi:%'
                  AND "FindingKey" <> {Normalized("\"FindingKey\"")};
                """);

            migrationBuilder.Sql($"""
                WITH candidates AS (
                    SELECT "Id", "ProjectId", "FindingKind",
                           {Normalized("\"FindingKey\"")} AS normalized,
                           "Status" IN {OpenTicketStatuses} AS is_open,
                           row_number() OVER (
                               PARTITION BY "ProjectId", "FindingKind", {Normalized("\"FindingKey\"")},
                                            "Status" IN {OpenTicketStatuses}
                               ORDER BY "CreatedAt", "Id") AS rank
                    FROM "Tickets"
                    WHERE "FindingKey" LIKE 'pypi:%'
                      AND "FindingKey" <> {Normalized("\"FindingKey\"")}
                )
                UPDATE "Tickets" t
                SET "FindingKey" = c.normalized
                FROM candidates c
                WHERE t."Id" = c."Id"
                  AND (NOT c.is_open OR (c.rank = 1 AND NOT EXISTS (
                      SELECT 1 FROM "Tickets" o
                      WHERE o."ProjectId" = c."ProjectId"
                        AND o."FindingKind" = c."FindingKind"
                        AND o."FindingKey" = c.normalized
                        AND o."Status" IN {OpenTicketStatuses})));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
