using FluentAssertions;
using Sentinel.Application.Tickets.UploadAttachment;

namespace Sentinel.Tests.Services;

public class TicketAttachmentUploadModelTests
{
    [Theory]
    [InlineData("rapport final.pdf", "rapport_final.pdf")]
    [InlineData(@"C:\Users\dev\capture.png", "capture.png")]
    [InlineData("../../etc/passwd.txt", "passwd.txt")]
    [InlineData("fac\u0000ture\u0007.pdf", "facture.pdf")]
    [InlineData("<script>.txt", "script.txt")]
    public void SanitizedFileName_RemovesPathsAndUnsafeCharacters(string fileName, string expected)
    {
        NewModel(fileName).SanitizedFileName.Should().Be(expected);
    }

    [Fact]
    public void SanitizedFileName_TooLong_IsTruncatedKeepingTheExtension()
    {
        string sanitized = NewModel(new string('a', 400) + ".pdf").SanitizedFileName;

        sanitized.Should().HaveLength(TicketAttachmentUploadModel.MaxFileNameLength).And.EndWith(".pdf");
    }

    private static TicketAttachmentUploadModel NewModel(string fileName) => new()
    {
        FileName = fileName,
        ContentType = "application/pdf",
        Size = 1,
        Content = Stream.Null
    };
}
