using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRepositoryScopeAndInternalPackages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Branch",
                table: "Projects",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RootPath",
                table: "Projects",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InternalPackages",
                table: "Organizations",
                type: "character varying(10000)",
                maxLength: 10000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsInternal",
                table: "Dependencies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ManifestPath",
                table: "Dependencies",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Branch",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "RootPath",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InternalPackages",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "IsInternal",
                table: "Dependencies");

            migrationBuilder.DropColumn(
                name: "ManifestPath",
                table: "Dependencies");
        }
    }
}
