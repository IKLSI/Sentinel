using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddKanbanColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "KanbanColumnId",
                table: "Tickets",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "KanbanColumns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Color = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KanbanColumns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KanbanColumns_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_KanbanColumnId",
                table: "Tickets",
                column: "KanbanColumnId");

            migrationBuilder.CreateIndex(
                name: "IX_KanbanColumns_OrganizationId",
                table: "KanbanColumns",
                column: "OrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_KanbanColumns_KanbanColumnId",
                table: "Tickets",
                column: "KanbanColumnId",
                principalTable: "KanbanColumns",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_KanbanColumns_KanbanColumnId",
                table: "Tickets");

            migrationBuilder.DropTable(
                name: "KanbanColumns");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_KanbanColumnId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "KanbanColumnId",
                table: "Tickets");
        }
    }
}
