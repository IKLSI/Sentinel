using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSlaSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SlaCriticalHours",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 4);

            migrationBuilder.AddColumn<int>(
                name: "SlaHighHours",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 8);

            migrationBuilder.AddColumn<int>(
                name: "SlaLowHours",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 48);

            migrationBuilder.AddColumn<int>(
                name: "SlaMediumHours",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 24);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SlaCriticalHours",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "SlaHighHours",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "SlaLowHours",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "SlaMediumHours",
                table: "Organizations");
        }
    }
}
