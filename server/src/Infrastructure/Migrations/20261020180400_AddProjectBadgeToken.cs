using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectBadgeToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BadgeToken",
                table: "Projects",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_BadgeToken",
                table: "Projects",
                column: "BadgeToken",
                unique: true,
                filter: "\"BadgeToken\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Projects_BadgeToken",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "BadgeToken",
                table: "Projects");
        }
    }
}
