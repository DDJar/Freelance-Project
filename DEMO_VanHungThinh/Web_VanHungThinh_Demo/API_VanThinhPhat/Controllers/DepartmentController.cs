using API_VanHungThinh.Services;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Hubs;
using Microsoft.AspNetCore.Mvc;

namespace API_VanThinhPhat.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentController : ControllerBase
{
    private readonly IDepartmentService _departmentService;
    private readonly INotificationService _notificationService;

    public DepartmentController(IDepartmentService departmentService, INotificationService notificationService)
    {
        _departmentService = departmentService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 1000) pageSize = 50;

        var (departments, totalCount) = await _departmentService.GetAllAsync(page, pageSize);
        return Ok(new {
            data = departments,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    // Fix routing conflict bằng cách thêm prefix
    [HttpGet("id/{id}")]
    public async Task<ActionResult<Department>> GetById(string id)
    {
        var department = await _departmentService.GetByIdAsync(id);
        if (department == null)
        {
            return NotFound($"Department with ID {id} not found");
        }
        return Ok(department);
    }

    [HttpGet("name/{departmentName}")]
    public async Task<ActionResult<Department>> GetByDepartmentName(string departmentName)
    {
        var department = await _departmentService.GetByDepartmentNameAsync(departmentName);
        if (department == null)
        {
            return NotFound($"Department with name {departmentName} not found");
        }
        return Ok(department);
    }

    // API chính cho luồng department -> business
    [HttpGet("business/{departmentName}")]
    public async Task<ActionResult<List<string>>> GetPositionByDepartmentName(string departmentName)
    {
        var businesses = await _departmentService.GetPositionByDepartmentNameAsync(departmentName);
        if (businesses == null || businesses.Count == 0)
        {
            return NotFound($"No businesses found for department: {departmentName}");
        }
        return Ok(businesses);
    }

    // API tối ưu cho dropdown department (chỉ lấy tên)
    [HttpGet("names")]
    public async Task<ActionResult<List<string>>> GetDepartmentNames()
    {
        var departments = await _departmentService.GetAllAsync();
        var departmentNames = departments
            .Where(d => !string.IsNullOrEmpty(d.DepartmentName))
            .Select(d => d.DepartmentName)
            .ToList();
        return Ok(departmentNames);
    }

    [HttpPost]
    public async Task<ActionResult<Department>> Create([FromBody] Department department)
    {
        var created = await _departmentService.CreateAsync(department);
        await _notificationService.NotifyCreated(EntityType.Department, created.Id ?? "", created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("id/{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Department department)
    {
        var existing = await _departmentService.GetByIdAsync(id);
        if (existing == null) return NotFound($"Department with ID {id} not found.");

        department.Id = id;
        await _departmentService.UpdateAsync(id, department);
        await _notificationService.NotifyUpdated(EntityType.Department, id, department);
        return NoContent();
    }

    [HttpDelete("id/{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _departmentService.GetByIdAsync(id);
        if (existing == null) return NotFound($"Department with ID {id} not found.");

        await _departmentService.DeleteAsync(id);
        await _notificationService.NotifyDeleted(EntityType.Department, id);
        return NoContent();
    }
}
