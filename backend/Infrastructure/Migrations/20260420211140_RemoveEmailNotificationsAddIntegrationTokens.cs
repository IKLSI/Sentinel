using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEmailNotificationsAddIntegrationTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailNotifications",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "GithubToken",
                table: "Organizations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GitlabToken",
                table: "Organizations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GithubToken",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "GitlabToken",
                table: "Organizations");

            migrationBuilder.AddColumn<bool>(
                name: "EmailNotifications",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
