using System.Xml;
using FluentAssertions;
using Sentinel.Domain.Parsing;

namespace Sentinel.Tests.Services;

public class UntrustedXmlTests
{
    [Fact]
    public void Parse_ReadsPlainDocument()
    {
        const string content = "<metadata><versioning><release>1.2.3</release></versioning></metadata>";

        UntrustedXml.Parse(content).Root!.Element("versioning")!.Element("release")!.Value.Should().Be("1.2.3");
    }

    [Fact]
    public void Parse_RejectsDocumentDeclaringDtd()
    {
        const string content = """
        <?xml version="1.0"?>
        <!DOCTYPE metadata [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
        <metadata><versioning><release>&xxe;</release></versioning></metadata>
        """;

        Action parse = () => UntrustedXml.Parse(content);

        parse.Should().Throw<XmlException>();
    }
}
