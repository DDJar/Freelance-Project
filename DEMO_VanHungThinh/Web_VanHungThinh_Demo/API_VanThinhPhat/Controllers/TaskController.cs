using API_VanHungThinh.Models;
using API_VanHungThinh.Services;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Hubs;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly INotificationService _notificationService;

        public TasksController(ITaskService taskService, INotificationService notificationService)
        {
            _taskService = taskService;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Tasks>>> GetAll() =>
            Ok(await _taskService.GetAllAsync());

        [HttpGet("{id}")]
        public async Task<ActionResult<Tasks>> GetById(string id)
        {
            var task = await _taskService.GetByIdAsync(id);
            if (task == null) return NotFound();
            return Ok(task);
        }

        [HttpPost]
        public async Task<ActionResult> Create(Tasks task)
        {
            await _taskService.CreateAsync(task);
            await _notificationService.NotifyCreated(EntityType.Task, task.Id ?? "", task);
            return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(string id, Tasks task)
        {
            var existing = await _taskService.GetByIdAsync(id);
            if (existing == null) return NotFound();

            task.Id = id;
            await _taskService.UpdateAsync(id, task);
            await _notificationService.NotifyUpdated(EntityType.Task, id, task);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var existing = await _taskService.GetByIdAsync(id);
            if (existing == null) return NotFound();

            await _taskService.DeleteAsync(id);
            await _notificationService.NotifyDeleted(EntityType.Task, id);
            return NoContent();
        }
    }
}

