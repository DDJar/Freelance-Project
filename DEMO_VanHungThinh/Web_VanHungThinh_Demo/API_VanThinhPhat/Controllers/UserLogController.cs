using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserLogController : ControllerBase
    {
        private readonly IUserLogService _logService;

        public UserLogController(IUserLogService logService)
        {
            _logService = logService;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserLog>>> GetAll()
        {
            var logs = await _logService.GetAllAsync();
            return Ok(logs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserLog>> GetById(string id)
        {
            var log = await _logService.GetByIdAsync(id);
            if (log == null) return NotFound();
            return Ok(log);
        }

        [HttpPost]
        public async Task<ActionResult<UserLog>> Create([FromBody] UserLog log)
        {
            var created = await _logService.CreateAsync(log);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UserLog log)
        {
            var existing = await _logService.GetByIdAsync(id);
            if (existing == null) return NotFound();

            log.Id = id;
            await _logService.UpdateAsync(id, log);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var existing = await _logService.GetByIdAsync(id);
            if (existing == null) return NotFound();

            await _logService.DeleteAsync(id);
            return NoContent();
        }
    }
}
