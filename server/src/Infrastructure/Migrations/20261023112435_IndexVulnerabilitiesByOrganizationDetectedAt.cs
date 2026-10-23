using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class IndexVulnerabilitiesByOrganizationDetectedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vulnerabilities_DetectedAt",
                table: "Vulnerabilities");

            migrationBuilder.CreateIndex(
                name: "IX_Vulnerabilities_OrganizationId_DetectedAt",
                table: "Vulnerabilities",
                columns: new[] { "OrganizationId", "DetectedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vulnerabilities_OrganizationId_DetectedAt",
                table: "Vulnerabilities");

            migrationBuilder.CreateIndex(
                name: "IX_Vulnerabilities_DetectedAt",
                table: "Vulnerabilities",
                column: "DetectedAt");
        }
    }
}
