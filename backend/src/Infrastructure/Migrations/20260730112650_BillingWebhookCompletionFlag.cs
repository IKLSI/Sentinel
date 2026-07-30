using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BillingWebhookCompletionFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "ProcessedStripeEvents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""ProcessedStripeEvents""
SET ""CompletedAt"" = ""ProcessedAt""
WHERE ""CompletedAt"" IS NULL;
");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessedStripeEvents_CompletedAt",
                table: "ProcessedStripeEvents",
                column: "CompletedAt",
                filter: "\"CompletedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProcessedStripeEvents_CompletedAt",
                table: "ProcessedStripeEvents");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "ProcessedStripeEvents");
        }
    }
}
