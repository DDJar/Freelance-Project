using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PermissionController : ControllerBase
    {
        private readonly IPermissionService _permissionService;

        public PermissionController(IPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var all = await _permissionService.GetAllAsync();
            return Ok(all);
        }

        [HttpGet("role/{role}")]
        public async Task<IActionResult> GetByRole(string role)
        {
            var p = await _permissionService.GetByRoleAsync(role);
            if (p == null) return NotFound();
            return Ok(p);
        }


        // Create new permission
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Permission permission)
        {
            if (permission == null) return BadRequest("Permission required");
            permission.Id = null; // Ensure new
            var result = await _permissionService.CreateAsync(permission);
            return Ok(result);
        }

        // Update permission by id
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Permission permission)
        {
            if (permission == null) return BadRequest("Permission required");
            permission.Id = id;
            var result = await _permissionService.UpdateAsync(permission);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _permissionService.DeleteAsync(id);
            return NoContent();
        }
    }
}
