using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ClampScanFrequencyToPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE ""Projects"" p
SET ""ScanFrequency"" = 'Monthly'
FROM ""Organizations"" o
WHERE p.""OrganizationId"" = o.""Id""
  AND o.""PlanTier"" = 'Free'
  AND p.""ScanFrequency"" IN ('Daily', 'Weekly');
");

            migrationBuilder.Sql(@"
UPDATE ""Projects"" p
SET ""ScanFrequency"" = 'Weekly'
FROM ""Organizations"" o
WHERE p.""OrganizationId"" = o.""Id""
  AND o.""PlanTier"" = 'Pro'
  AND p.""ScanFrequency"" = 'Daily';
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
