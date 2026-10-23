using System.Xml;
using System.Xml.Linq;

namespace Sentinel.Domain.Parsing;

public static class UntrustedXml
{
    private static readonly XmlReaderSettings Settings = new()
    {
        DtdProcessing = DtdProcessing.Prohibit,
        XmlResolver = null,
    };

    public static XDocument Parse(string content)
    {
        using XmlReader reader = XmlReader.Create(new StringReader(content), Settings);
        return XDocument.Load(reader);
    }
}
