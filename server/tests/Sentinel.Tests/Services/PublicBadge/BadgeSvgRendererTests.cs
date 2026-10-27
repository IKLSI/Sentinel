using FluentAssertions;
using Sentinel.Application.Projects.Badge;

namespace Sentinel.Tests.Services.PublicBadge;

public class BadgeSvgRendererTests
{
    [Theory]
    [InlineData("A", 95, "#16a34a")]
    [InlineData("B", 80, "#0d9488")]
    [InlineData("C", 65, "#d97706")]
    [InlineData("D", 50, "#ea580c")]
    [InlineData("E", 35, "#dc2626")]
    [InlineData("F", 10, "#dc2626")]
    public void Render_AvecUneNote_AfficheLaNoteLeScoreEtLaCouleurDuGrade(string grade, int score, string color)
    {
        string svg = BadgeSvgRenderer.Render("api-gateway", grade, score);

        svg.Should().Contain($"{grade} · {score}").And.Contain(color).And.Contain("api-gateway");
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("A", null)]
    [InlineData(null, 90)]
    [InlineData("Z", 90)]
    public void Render_SansNoteValide_AfficheInconnu(string? grade, int? score)
    {
        string svg = BadgeSvgRenderer.Render("api-gateway", grade, score);

        svg.Should().Contain(BadgeSvgRenderer.UnknownValue);
    }

    [Fact]
    public void Render_ProduitUnSvgBienFormeAvecLesDimensionsCoherentes()
    {
        string svg = BadgeSvgRenderer.Render("api-gateway", "A", 92);

        svg.Should().StartWith("<svg").And.EndWith("</svg>").And.Contain("role=\"img\"");
        System.Xml.Linq.XDocument.Parse(svg).Root!.Name.LocalName.Should().Be("svg");
    }

    [Fact]
    public void Render_LibelleAvecCaracteresSpeciaux_EstEchappe()
    {
        string svg = BadgeSvgRenderer.Render("a<b>&\"c'", "A", 92);

        svg.Should().NotContain("<b>").And.Contain("a&lt;b&gt;&amp;&quot;c&#39;");
        System.Xml.Linq.XDocument.Parse(svg).Root!.Name.LocalName.Should().Be("svg");
    }

    [Fact]
    public void Render_LibelleTropLong_EstTronque()
    {
        string svg = BadgeSvgRenderer.Render(new string('x', 80), "A", 92);

        svg.Should().Contain(new string('x', 23) + "…").And.NotContain(new string('x', 24));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Render_LibelleVide_UtiliseLeLibelleParDefaut(string label)
    {
        string svg = BadgeSvgRenderer.Render(label, "A", 92);

        svg.Should().Contain(BadgeSvgRenderer.DefaultLabel);
    }
}
