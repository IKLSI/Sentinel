namespace Sentinel.Domain.Versioning;

public class VersionComparer : IComparer<string>
{
    public static readonly VersionComparer Instance = new();

    private const int ReleaseRank = 0;
    private const int UnknownQualifierRank = -1;

    private static readonly Dictionary<string, int> QualifierRanks = new(StringComparer.Ordinal)
    {
        ["dev"] = -6,
        ["a"] = -5,
        ["alpha"] = -5,
        ["b"] = -4,
        ["beta"] = -4,
        ["m"] = -3,
        ["milestone"] = -3,
        ["c"] = -2,
        ["rc"] = -2,
        ["cr"] = -2,
        ["pre"] = -2,
        ["preview"] = -2,
        ["final"] = ReleaseRank,
        ["ga"] = ReleaseRank,
        ["release"] = ReleaseRank,
        ["post"] = 1,
        ["p"] = 1,
        ["r"] = 1,
        ["rev"] = 1,
        ["sp"] = 1,
        ["patch"] = 1,
    };

    private readonly record struct Token(string Text, bool IsNumeric)
    {
        public int Rank => IsNumeric
            ? ReleaseRank
            : QualifierRanks.GetValueOrDefault(Text, UnknownQualifierRank);
    }

    public int Compare(string? x, string? y)
    {
        (string leftEpoch, List<Token> left) = Tokenize(x);
        (string rightEpoch, List<Token> right) = Tokenize(y);

        int epochComparison = CompareNumbers(leftEpoch, rightEpoch);
        if (epochComparison != 0) return epochComparison;

        bool inPrerelease = false;

        for (int i = 0; i < Math.Max(left.Count, right.Count); i++)
        {
            Token? leftToken = i < left.Count ? left[i] : null;
            Token? rightToken = i < right.Count ? right[i] : null;

            int comparison = CompareTokens(leftToken, rightToken, inPrerelease);
            if (comparison != 0) return comparison;

            if (leftToken is { IsNumeric: false } token && token.Rank < ReleaseRank) inPrerelease = true;
        }

        return 0;
    }

    private static int CompareTokens(Token? left, Token? right, bool inPrerelease)
    {
        if (left == null) return right == null ? 0 : -CompareToMissing(right.Value);
        if (right == null) return CompareToMissing(left.Value);

        Token l = left.Value;
        Token r = right.Value;

        if (l.IsNumeric && r.IsNumeric) return CompareNumbers(l.Text, r.Text);
        if (l.IsNumeric) return inPrerelease ? -1 : 1;
        if (r.IsNumeric) return inPrerelease ? 1 : -1;

        int rankComparison = l.Rank.CompareTo(r.Rank);
        if (rankComparison != 0) return rankComparison;

        return l.Rank == UnknownQualifierRank ? string.CompareOrdinal(l.Text, r.Text) : 0;
    }

    private static int CompareToMissing(Token token) => token.IsNumeric
        ? CompareNumbers(token.Text, "0")
        : token.Rank.CompareTo(ReleaseRank);

    private static int CompareNumbers(string left, string right)
    {
        string leftDigits = left.TrimStart('0');
        string rightDigits = right.TrimStart('0');

        int lengthComparison = leftDigits.Length.CompareTo(rightDigits.Length);
        return lengthComparison != 0 ? lengthComparison : string.CompareOrdinal(leftDigits, rightDigits);
    }

    private static (string Epoch, List<Token> Tokens) Tokenize(string? version)
    {
        string text = (version ?? string.Empty).Trim().ToLowerInvariant();

        if (text.StartsWith('v')) text = text[1..];

        int buildSeparator = text.IndexOf('+');
        if (buildSeparator >= 0) text = text[..buildSeparator];

        string epoch = "0";
        int epochSeparator = text.IndexOf('!');
        if (epochSeparator > 0 && text[..epochSeparator].All(char.IsAsciiDigit))
        {
            epoch = text[..epochSeparator];
            text = text[(epochSeparator + 1)..];
        }

        List<Token> tokens = [];
        int start = 0;

        for (int i = 0; i <= text.Length; i++)
        {
            bool atEnd = i == text.Length;
            bool isSeparator = !atEnd && !char.IsAsciiLetterOrDigit(text[i]);
            bool kindChanges = !atEnd && !isSeparator && i > start
                && char.IsAsciiDigit(text[i]) != char.IsAsciiDigit(text[i - 1]);

            if (!atEnd && !isSeparator && !kindChanges) continue;

            if (i > start)
            {
                string part = text[start..i];
                tokens.Add(new Token(part, char.IsAsciiDigit(part[0])));
            }

            start = isSeparator ? i + 1 : i;
        }

        while (tokens.Count > 0 && tokens[^1] is { IsNumeric: false, Rank: ReleaseRank })
            tokens.RemoveAt(tokens.Count - 1);

        return (epoch, tokens);
    }
}
