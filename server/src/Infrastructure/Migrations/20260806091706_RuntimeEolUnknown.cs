using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Sentinel.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RuntimeEolUnknown : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsEol",
                table: "Runtimes",
                type: "boolean",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.Sql("""UPDATE "Runtimes" SET "IsEol" = NULL WHERE "IsEol" = FALSE;""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsEol",
                table: "Runtimes",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldNullable: true);
        }
    }
}
