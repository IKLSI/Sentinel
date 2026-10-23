using System.Reflection;
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
using Sentinel.Application.Common.Contracts;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Sentinel.API.OpenApi;

public sealed class EnumValuesSchemaFilter : ISchemaFilter
{
    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema is not OpenApiSchema concrete
            || context.MemberInfo?.GetCustomAttribute<EnumValuesAttribute>() is not { } enumValues)
            return;

        concrete.Enum = enumValues.Values.Select(value => (JsonNode)JsonValue.Create(value)).ToList();
    }
}
