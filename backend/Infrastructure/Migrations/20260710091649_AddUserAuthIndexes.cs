using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAuthIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Users_PreviousRefreshTokenHash",
                table: "Users",
                column: "PreviousRefreshTokenHash",
                filter: "\"PreviousRefreshTokenHash\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Users_RefreshToken",
                table: "Users",
                column: "RefreshToken",
                filter: "\"RefreshToken\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_PreviousRefreshTokenHash",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_RefreshToken",
                table: "Users");
        }
    }
}
