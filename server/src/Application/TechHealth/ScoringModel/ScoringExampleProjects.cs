using Sentinel.Domain.Entities;

namespace Sentinel.Application.TechHealth.ScoringModel;

public static class ScoringExampleProjects
{
    public const string OnlineStore = "Boutique en ligne";
    public const string PaymentApi = "API Paiements";
    public const string CustomerPortal = "Portail client";
    public const string MobileApp = "App mobile";

    public static readonly DateTime AsOf = new(2026, 10, 21, 0, 0, 0, DateTimeKind.Utc);

    private const string LaggingVersion = "1.4.0";
    private const string NextMajorVersion = "2.1.0";
    private const string NextMinorVersion = "1.6.0";

    public static IReadOnlyList<Project> All() =>
        [OnlineStoreProject(), PaymentApiProject(), CustomerPortalProject(), MobileAppProject()];

    private static Project OnlineStoreProject()
    {
        Project project = NewProject(OnlineStore);

        AddDependencies(project, DependencyEcosystem.Npm, NextMajorVersion,
            "express", "webpack", "mongoose", "stripe", "sharp", "jsonwebtoken", "helmet", "multer", "nodemailer",
            "uuid", "redux", "react-redux", "styled-components", "eslint", "jest", "typescript", "passport",
            "socket.io");
        AddDependencies(project, DependencyEcosystem.Npm, LaggingVersion,
            "react", "react-dom", "react-server-dom-webpack", "next", "axios", "lodash", "moment", "dotenv", "cors",
            "body-parser", "dayjs");
        AddDeprecatedDependencies(project, DependencyEcosystem.Npm, "request", "node-sass");

        AddVulnerability(Find(project, "react-server-dom-webpack"), VulnerabilitySeverity.Critical,
            alias: "CVE-2025-55182", isKnownExploited: true);
        AddVulnerabilities(project, VulnerabilitySeverity.High, 6, "axios", "lodash", "express", "jsonwebtoken",
            "webpack", "multer");
        AddVulnerabilities(project, VulnerabilitySeverity.Medium, 7, "next", "moment", "request", "node-sass",
            "body-parser", "socket.io", "passport");
        AddVulnerabilities(project, VulnerabilitySeverity.Low, 3, "cors", "dayjs", "uuid");

        project.Runtimes.Add(new Runtime
        {
            Name = "Node.js",
            Version = "20",
            EolDate = new DateTime(2026, 4, 30, 0, 0, 0, DateTimeKind.Utc),
            IsEol = true
        });

        return project;
    }

    private static Project PaymentApiProject()
    {
        Project project = NewProject(PaymentApi);

        AddDependencies(project, DependencyEcosystem.NuGet, NextMajorVersion,
            "Swashbuckle.AspNetCore", "AutoMapper", "MediatR", "FluentValidation", "Serilog.AspNetCore", "Polly",
            "Npgsql", "Dapper", "StackExchange.Redis", "Hangfire.Core", "RestSharp", "Stripe.net", "Quartz",
            "NodaTime", "Humanizer.Core", "CsvHelper", "Scrutor");
        AddDependencies(project, DependencyEcosystem.NuGet, LaggingVersion,
            "Newtonsoft.Json", "Microsoft.EntityFrameworkCore", "System.IdentityModel.Tokens.Jwt",
            "Microsoft.AspNetCore.Authentication.JwtBearer", "MassTransit", "Azure.Identity",
            "Microsoft.Data.SqlClient");
        AddDeprecatedDependencies(project, DependencyEcosystem.NuGet, "BouncyCastle", "Microsoft.Azure.Storage.Blob");

        AddVulnerability(Find(project, "BouncyCastle"), VulnerabilitySeverity.Critical, epssScore: 0.42m);
        AddVulnerabilities(project, VulnerabilitySeverity.High, 3, "Newtonsoft.Json", "RestSharp",
            "System.IdentityModel.Tokens.Jwt");
        AddVulnerabilities(project, VulnerabilitySeverity.Medium, 6, "Npgsql", "MassTransit", "Polly",
            "Microsoft.Azure.Storage.Blob", "Hangfire.Core", "Azure.Identity");

        project.Runtimes.Add(new Runtime
        {
            Name = ".NET",
            Version = "8",
            EolDate = new DateTime(2026, 11, 10, 0, 0, 0, DateTimeKind.Utc),
            IsEol = false
        });

        return project;
    }

    private static Project CustomerPortalProject()
    {
        Project project = NewProject(CustomerPortal);

        AddDependencies(project, DependencyEcosystem.Npm, NextMajorVersion,
            "vue-i18n", "chart.js", "date-fns", "@vueuse/core", "vee-validate", "sortablejs");
        AddDependencies(project, DependencyEcosystem.Npm, NextMinorVersion, "vue", "pinia", "axios");
        AddDependencies(project, DependencyEcosystem.Npm, LaggingVersion,
            "vue-router", "dompurify", "marked", "qs", "zod", "nprogress", "mitt", "js-cookie", "lodash-es", "dayjs",
            "uuid", "fuse.js", "file-saver");

        AddVulnerabilities(project, VulnerabilitySeverity.Medium, 2, "axios", "marked");
        AddVulnerabilities(project, VulnerabilitySeverity.Low, 3, "qs", "dompurify", "date-fns");

        return project;
    }

    private static Project MobileAppProject()
    {
        Project project = NewProject(MobileApp);

        AddDependencies(project, DependencyEcosystem.Npm, NextMajorVersion,
            "@react-navigation/native", "react-native-reanimated", "react-native-svg");
        AddDependencies(project, DependencyEcosystem.Npm, NextMinorVersion,
            "react-native", "expo", "@tanstack/react-query");
        AddDependencies(project, DependencyEcosystem.Npm, LaggingVersion,
            "react", "zustand", "axios", "i18next", "react-i18next", "date-fns", "react-native-mmkv",
            "react-native-gesture-handler", "react-native-safe-area-context", "react-native-screens",
            "lottie-react-native", "expo-notifications", "expo-image");

        Dependency babelTraverse = NewDependency("@babel/traverse", DependencyEcosystem.Npm, LaggingVersion);
        babelTraverse.Type = DependencyType.Dev;
        project.Dependencies.Add(babelTraverse);

        AddVulnerability(babelTraverse, VulnerabilitySeverity.High);
        AddVulnerabilities(project, VulnerabilitySeverity.Medium, 1, "axios");
        AddVulnerabilities(project, VulnerabilitySeverity.Low, 2, "react-native-svg", "i18next");

        return project;
    }

    private static Project NewProject(string name) => new()
    {
        Name = name,
        Dependencies = new List<Dependency>(),
        Runtimes = new List<Runtime>()
    };

    private static void AddDependencies(Project project, DependencyEcosystem ecosystem, string latestVersion,
        params string[] names)
    {
        foreach (string name in names)
            project.Dependencies.Add(NewDependency(name, ecosystem, latestVersion));
    }

    private static void AddDeprecatedDependencies(Project project, DependencyEcosystem ecosystem,
        params string[] names)
    {
        foreach (string name in names)
        {
            Dependency dependency = NewDependency(name, ecosystem, LaggingVersion);
            dependency.IsDeprecated = true;
            project.Dependencies.Add(dependency);
        }
    }

    private static Dependency NewDependency(string name, DependencyEcosystem ecosystem, string latestVersion) => new()
    {
        Name = name,
        Ecosystem = ecosystem,
        CurrentVersion = LaggingVersion,
        LatestVersion = latestVersion,
        Vulnerabilities = new List<Vulnerability>()
    };

    private static Dependency Find(Project project, string name) =>
        project.Dependencies.First(dependency => dependency.Name == name);

    private static void AddVulnerabilities(Project project, VulnerabilitySeverity severity, int count,
        params string[] packageNames)
    {
        for (int index = 0; index < count; index++)
            AddVulnerability(Find(project, packageNames[index % packageNames.Length]), severity);
    }

    private static void AddVulnerability(Dependency dependency, VulnerabilitySeverity severity,
        string? alias = null, decimal? epssScore = null, bool isKnownExploited = false) =>
        dependency.Vulnerabilities.Add(new Vulnerability
        {
            CveId = alias ?? $"EXAMPLE-{dependency.Name}-{dependency.Vulnerabilities.Count + 1}",
            CveAlias = alias,
            PackageName = dependency.Name,
            Severity = severity,
            EpssScore = epssScore,
            IsKnownExploited = isKnownExploited
        });
}
