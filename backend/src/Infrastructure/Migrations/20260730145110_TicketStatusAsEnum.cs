using System;
using System.Linq;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TicketStatusAsEnum : Migration
    {
        private const string StatusFromName = @"
            CASE ""Name""
                WHEN 'Nouveau' THEN 'New'
                WHEN 'En cours' THEN 'InProgress'
                WHEN 'En test' THEN 'Testing'
                WHEN 'Tests' THEN 'Testing'
                WHEN 'Résolu' THEN 'Resolved'
                WHEN 'Fermé' THEN 'Closed'
                ELSE CASE WHEN ""IsClosed"" THEN 'Closed' ELSE 'New' END
            END";

        private static string HistoryValueFromName(string column) => $@"
            UPDATE ""TicketHistories"" SET ""{column}"" =
                CASE ""{column}""
                    WHEN 'Nouveau' THEN 'new'
                    WHEN 'En cours' THEN 'inprogress'
                    WHEN 'En test' THEN 'testing'
                    WHEN 'Tests' THEN 'testing'
                    WHEN 'Résolu' THEN 'resolved'
                    WHEN 'Fermé' THEN 'closed'
                    ELSE ""{column}""
                END
            WHERE ""Field"" = 'Status';";

        private static string NotificationParamFromName(string field) => string.Concat(
            new[] { ("Nouveau", "new"), ("En cours", "inprogress"), ("En test", "testing"), ("Tests", "testing"),
                ("Résolu", "resolved"), ("Fermé", "closed") }
                .Select(pair => $@"
                    UPDATE ""Notifications""
                    SET ""MessageParams"" = REPLACE(""MessageParams"",
                        '""{field}"":""{pair.Item1}""', '""{field}"":""{pair.Item2}""')
                    WHERE ""MessageParams"" LIKE '%""{field}"":""{pair.Item1}""%';"));

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Tickets",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "New");

            migrationBuilder.Sql($@"
                UPDATE ""Tickets"" t
                SET ""Status"" = s.""MappedStatus""
                FROM (SELECT ""Id"", {StatusFromName} AS ""MappedStatus"" FROM ""TicketStatuses"") s
                WHERE t.""TicketStatusId"" = s.""Id"";");

            migrationBuilder.Sql(HistoryValueFromName("OldValue"));
            migrationBuilder.Sql(HistoryValueFromName("NewValue"));
            migrationBuilder.Sql(NotificationParamFromName("oldStatus"));
            migrationBuilder.Sql(NotificationParamFromName("newStatus"));

            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_TicketStatuses_TicketStatusId",
                table: "Tickets");

            migrationBuilder.DropTable(
                name: "TicketStatuses");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_OrganizationId_Priority_TicketStatusId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_OrganizationId_TicketStatusId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_TicketStatusId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "TicketStatusId",
                table: "Tickets");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId_Priority_Status",
                table: "Tickets",
                columns: new[] { "OrganizationId", "Priority", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId_Status",
                table: "Tickets",
                columns: new[] { "OrganizationId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Status",
                table: "Tickets",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_OrganizationId_Priority_Status",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_OrganizationId_Status",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_Status",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Tickets");

            migrationBuilder.AddColumn<Guid>(
                name: "TicketStatusId",
                table: "Tickets",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TicketStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Color = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsClosed = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketStatuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketStatuses_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId_Priority_TicketStatusId",
                table: "Tickets",
                columns: new[] { "OrganizationId", "Priority", "TicketStatusId" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId_TicketStatusId",
                table: "Tickets",
                columns: new[] { "OrganizationId", "TicketStatusId" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TicketStatusId",
                table: "Tickets",
                column: "TicketStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketStatuses_OrganizationId",
                table: "TicketStatuses",
                column: "OrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_TicketStatuses_TicketStatusId",
                table: "Tickets",
                column: "TicketStatusId",
                principalTable: "TicketStatuses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
