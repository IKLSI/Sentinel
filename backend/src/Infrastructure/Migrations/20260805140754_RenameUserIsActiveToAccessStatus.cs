using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameUserIsActiveToAccessStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccessStatus",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Active");

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "AccessStatus" = CASE WHEN "IsActive" THEN 'Active' ELSE 'Suspended' END;
                """);

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "IsActive" = ("AccessStatus" = 'Active');
                """);

            migrationBuilder.DropColumn(
                name: "AccessStatus",
                table: "Users");
        }
    }
}
