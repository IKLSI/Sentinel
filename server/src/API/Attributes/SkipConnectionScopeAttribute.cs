namespace Sentinel.API.Attributes;

[AttributeUsage(AttributeTargets.Method)]
public sealed class SkipConnectionScopeAttribute : Attribute;
