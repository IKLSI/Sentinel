using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameTokenToTokenHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Token",
                table: "UserInvitations",
                newName: "TokenHash");

            migrationBuilder.RenameIndex(
                name: "IX_UserInvitations_Token",
                table: "UserInvitations",
                newName: "IX_UserInvitations_TokenHash");

            migrationBuilder.RenameColumn(
                name: "Token",
                table: "PasswordResetTokens",
                newName: "TokenHash");

            migrationBuilder.RenameIndex(
                name: "IX_PasswordResetTokens_Token",
                table: "PasswordResetTokens",
                newName: "IX_PasswordResetTokens_TokenHash");

            migrationBuilder.RenameColumn(
                name: "Token",
                table: "EmailVerificationTokens",
                newName: "TokenHash");

            migrationBuilder.RenameIndex(
                name: "IX_EmailVerificationTokens_Token",
                table: "EmailVerificationTokens",
                newName: "IX_EmailVerificationTokens_TokenHash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TokenHash",
                table: "UserInvitations",
                newName: "Token");

            migrationBuilder.RenameIndex(
                name: "IX_UserInvitations_TokenHash",
                table: "UserInvitations",
                newName: "IX_UserInvitations_Token");

            migrationBuilder.RenameColumn(
                name: "TokenHash",
                table: "PasswordResetTokens",
                newName: "Token");

            migrationBuilder.RenameIndex(
                name: "IX_PasswordResetTokens_TokenHash",
                table: "PasswordResetTokens",
                newName: "IX_PasswordResetTokens_Token");

            migrationBuilder.RenameColumn(
                name: "TokenHash",
                table: "EmailVerificationTokens",
                newName: "Token");

            migrationBuilder.RenameIndex(
                name: "IX_EmailVerificationTokens_TokenHash",
                table: "EmailVerificationTokens",
                newName: "IX_EmailVerificationTokens_Token");
        }
    }
}
