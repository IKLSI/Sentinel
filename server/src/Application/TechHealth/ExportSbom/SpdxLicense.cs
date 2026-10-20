using System.Text.RegularExpressions;

namespace Sentinel.Application.TechHealth.ExportSbom;

public static partial class SpdxLicense
{
    private static readonly HashSet<string> KnownIds = new(StringComparer.OrdinalIgnoreCase)
    {
        "MIT", "MIT-0", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "MPL-2.0", "EPL-1.0", "EPL-2.0",
        "LGPL-2.1-only", "LGPL-2.1-or-later", "LGPL-3.0-only", "LGPL-3.0-or-later",
        "GPL-2.0-only", "GPL-2.0-or-later", "GPL-3.0-only", "GPL-3.0-or-later",
        "AGPL-3.0-only", "AGPL-3.0-or-later", "Unlicense", "0BSD", "CC0-1.0", "CC-BY-4.0", "WTFPL", "Zlib",
        "PSF-2.0", "Python-2.0", "Ruby", "Artistic-2.0", "BSL-1.0", "BlueOak-1.0.0", "CDDL-1.0", "EUPL-1.2"
    };

    private static readonly Dictionary<string, string> Aliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["MIT License"] = "MIT",
        ["The MIT License"] = "MIT",
        ["MIT/X11"] = "MIT",
        ["Expat"] = "MIT",
        ["Apache 2.0"] = "Apache-2.0",
        ["Apache-2"] = "Apache-2.0",
        ["Apache 2"] = "Apache-2.0",
        ["Apache License 2.0"] = "Apache-2.0",
        ["Apache License, Version 2.0"] = "Apache-2.0",
        ["Apache Software License"] = "Apache-2.0",
        ["The Apache Software License, Version 2.0"] = "Apache-2.0",
        ["ASL 2.0"] = "Apache-2.0",
        ["BSD"] = "BSD-3-Clause",
        ["BSD License"] = "BSD-3-Clause",
        ["New BSD License"] = "BSD-3-Clause",
        ["Modified BSD License"] = "BSD-3-Clause",
        ["Simplified BSD License"] = "BSD-2-Clause",
        ["FreeBSD"] = "BSD-2-Clause",
        ["ISC License"] = "ISC",
        ["MPL 2.0"] = "MPL-2.0",
        ["Mozilla Public License 2.0"] = "MPL-2.0",
        ["GPL-2.0"] = "GPL-2.0-only",
        ["GPLv2"] = "GPL-2.0-only",
        ["GPL-2.0+"] = "GPL-2.0-or-later",
        ["GPL-3.0"] = "GPL-3.0-only",
        ["GPLv3"] = "GPL-3.0-only",
        ["GPL-3.0+"] = "GPL-3.0-or-later",
        ["LGPL-2.1"] = "LGPL-2.1-only",
        ["LGPLv2.1"] = "LGPL-2.1-only",
        ["LGPL-3.0"] = "LGPL-3.0-only",
        ["LGPLv3"] = "LGPL-3.0-only",
        ["AGPL-3.0"] = "AGPL-3.0-only",
        ["AGPLv3"] = "AGPL-3.0-only",
        ["Python Software Foundation License"] = "PSF-2.0",
        ["PSF"] = "PSF-2.0",
        ["Public Domain"] = "Unlicense",
        ["Boost Software License 1.0"] = "BSL-1.0",
        ["Eclipse Public License 2.0"] = "EPL-2.0",
    };

    public static string? IdOf(string license)
    {
        string trimmed = license.Trim().Trim('(', ')');

        if (KnownIds.TryGetValue(trimmed, out string? known)) return known;

        return Aliases.TryGetValue(trimmed, out string? alias) ? alias : null;
    }

    public static string? ExpressionOf(string license)
    {
        string[] parts = ExpressionOperatorRegex().Split(license.Trim());
        if (parts.Length < 2) return IdOf(license);

        List<string> normalized = new();

        foreach (string part in parts)
        {
            if (ExpressionOperatorRegex().IsMatch($" {part} "))
            {
                normalized.Add(part.Trim().ToUpperInvariant());
                continue;
            }

            if (IdOf(part) is not { } id) return null;

            normalized.Add(id);
        }

        return string.Join(' ', normalized);
    }

    [GeneratedRegex(@"\s+(AND|OR|and|or)\s+")]
    private static partial Regex ExpressionOperatorRegex();
}
