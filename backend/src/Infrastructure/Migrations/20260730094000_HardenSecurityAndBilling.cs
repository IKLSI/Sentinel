using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HardenSecurityAndBilling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "StoragePath",
                table: "TicketAttachments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<byte[]>(
                name: "Content",
                table: "TicketAttachments",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastBillingEventAt",
                table: "Organizations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProcessedStripeEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StripeEventId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    EventType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessedStripeEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RevokedTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Jti = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevokedTokens", x => x.Id);
                });

            migrationBuilder.Sql(@"
DO $$
DECLARE nombre_doublons integer;
BEGIN
    SELECT count(*)
    INTO nombre_doublons
    FROM (SELECT ""Email"" FROM ""Users"" GROUP BY ""Email"" HAVING count(*) > 1) AS doublons;

    IF nombre_doublons > 0 THEN
        RAISE EXCEPTION 'Migration interrompue : % adresse(s) email sont présentes dans plusieurs organisations et doivent être corrigées avant d''activer l''unicité globale. Pour les lister depuis un accès base autorisé : SELECT ""Email"", count(*) FROM ""Users"" GROUP BY ""Email"" HAVING count(*) > 1;', nombre_doublons;
    END IF;
END $$;
");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessedStripeEvents_ProcessedAt",
                table: "ProcessedStripeEvents",
                column: "ProcessedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessedStripeEvents_StripeEventId",
                table: "ProcessedStripeEvents",
                column: "StripeEventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RevokedTokens_ExpiresAt",
                table: "RevokedTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_RevokedTokens_Jti",
                table: "RevokedTokens",
                column: "Jti",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessedStripeEvents");

            migrationBuilder.DropTable(
                name: "RevokedTokens");

            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "TicketAttachments");

            migrationBuilder.DropColumn(
                name: "LastBillingEventAt",
                table: "Organizations");

            migrationBuilder.AlterColumn<string>(
                name: "StoragePath",
                table: "TicketAttachments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email");
        }
    }
}
