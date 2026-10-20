namespace Sentinel.API.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class AllowApiKeyAttribute : Attribute;
