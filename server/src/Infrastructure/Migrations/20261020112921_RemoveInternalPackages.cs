using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveInternalPackages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InternalPackages",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "IsInternal",
                table: "Dependencies");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
        }
    }
}
