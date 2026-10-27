using Microsoft.AspNetCore.Mvc;
using Sentinel.Application.ScoringModel;

namespace Sentinel.API.Controllers;

[ApiController]
[Route("api/public/scoring-model")]
public class PublicScoringModelController : BaseController
{
    [HttpGet]
    public ActionResult<ScoringModelDto> Get([FromServices] ScoringModelGetService service) =>
        ToActionResult(service.Execute());
}
