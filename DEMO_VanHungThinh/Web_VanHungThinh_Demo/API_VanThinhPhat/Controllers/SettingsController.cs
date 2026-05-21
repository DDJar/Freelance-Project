using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var s = await _settingsService.GetAsync();
            if (s == null) return NotFound();
            return Ok(s);
        }

        [HttpPut]
        public async Task<IActionResult> Upsert([FromBody] ProjectSettings settings)
        {
            if (settings == null) return BadRequest("Settings required");
            var res = await _settingsService.UpsertAsync(settings);
            return Ok(res);
        }
    }
}
