using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSprints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Tickets"" DROP CONSTRAINT IF EXISTS ""FK_Tickets_Sprints_SprintId"";");

            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""Sprints"";");

            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Tickets_SprintId"";");

            migrationBuilder.Sql(@"ALTER TABLE ""Tickets"" DROP COLUMN IF EXISTS ""SprintId"";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""Tickets"" ADD COLUMN IF NOT EXISTS ""SprintId"" uuid;");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""Sprints"" (
                    ""Id"" uuid NOT NULL,
                    ""OrganizationId"" uuid NOT NULL,
                    ""ProjectId"" uuid NOT NULL,
                    ""Name"" character varying(200) NOT NULL,
                    ""Goal"" text,
                    ""Status"" text NOT NULL,
                    ""StartDate"" date NOT NULL,
                    ""EndDate"" date NOT NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_Sprints"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_Sprints_Organizations_OrganizationId"" FOREIGN KEY (""OrganizationId"") REFERENCES ""Organizations"" (""Id"") ON DELETE RESTRICT,
                    CONSTRAINT ""FK_Sprints_TechProjects_ProjectId"" FOREIGN KEY (""ProjectId"") REFERENCES ""TechProjects"" (""Id"") ON DELETE CASCADE
                );");

            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Tickets_SprintId"" ON ""Tickets"" (""SprintId"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Sprints_OrganizationId"" ON ""Sprints"" (""OrganizationId"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Sprints_ProjectId"" ON ""Sprints"" (""ProjectId"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Sprints_Status"" ON ""Sprints"" (""Status"");");

            migrationBuilder.Sql(@"
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'FK_Tickets_Sprints_SprintId'
                    ) THEN
                        ALTER TABLE ""Tickets"" ADD CONSTRAINT ""FK_Tickets_Sprints_SprintId""
                            FOREIGN KEY (""SprintId"") REFERENCES ""Sprints"" (""Id"") ON DELETE SET NULL;
                    END IF;
                END $$;");
        }
    }
}
