using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGitIntegrationMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_GithubAccountId",
                table: "Organizations");

            migrationBuilder.DropIndex(
                name: "IX_Organizations_GitlabAccountId",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "GithubAccountId",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "GithubAccountLogin",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "GithubConnectedAt",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "GithubConnectedById",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "GitlabAccountId",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "GitlabAccountLogin",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "GitlabConnectedAt",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "GitlabConnectedById",
                table: "Organizations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GithubAccountId",
                table: "Organizations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GithubAccountLogin",
                table: "Organizations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "GithubConnectedAt",
                table: "Organizations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GithubConnectedById",
                table: "Organizations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GitlabAccountId",
                table: "Organizations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GitlabAccountLogin",
                table: "Organizations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "GitlabConnectedAt",
                table: "Organizations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GitlabConnectedById",
                table: "Organizations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_GithubAccountId",
                table: "Organizations",
                column: "GithubAccountId",
                unique: true,
                filter: "\"GithubAccountId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_GitlabAccountId",
                table: "Organizations",
                column: "GitlabAccountId",
                unique: true,
                filter: "\"GitlabAccountId\" IS NOT NULL");
        }
    }
}
