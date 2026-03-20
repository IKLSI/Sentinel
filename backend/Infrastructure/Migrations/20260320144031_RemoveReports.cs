using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TMAflow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reports");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    EmailSentTo = table.Column<string>(type: "text", nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PdfPath = table.Column<string>(type: "text", nullable: true),
                    Period = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    PeriodEnd = table.Column<string>(type: "text", nullable: true),
                    PeriodStart = table.Column<string>(type: "text", nullable: true),
                    ReportType = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reports_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reports_OrganizationId",
                table: "Reports",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_Period",
                table: "Reports",
                column: "Period");
        }
    }
}
