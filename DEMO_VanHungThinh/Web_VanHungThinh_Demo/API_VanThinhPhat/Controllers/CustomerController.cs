using API_VanHungThinh.Models;
using API_VanHungThinh.Services;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Hubs;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly INotificationService _notificationService;

    public CustomerController(ICustomerService customerService, INotificationService notificationService)
    {
        _customerService = customerService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 1000) pageSize = 50;

        var (customers, totalCount) = await _customerService.GetAsync(page, pageSize);
        return Ok(new {
            data = customers,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    [HttpGet("{id}")] 
    public async Task<ActionResult<CustomerEntity>> GetById(string id)
    {
        var customer = await _customerService.GetAsync(id);

        if (customer == null)
        {
            return NotFound($"Customer with ID {id} not found.");
        }

        return Ok(customer);
    }

    [HttpGet("by-name/{firstName}")]
    public async Task<ActionResult<List<CustomerEntity>>> GetByFirstName(string firstName)
    {
        var customers = await _customerService.GetByFirstNameAsync(firstName);

        if (customers == null || !customers.Any())
        {
            return NotFound($"No customers found with first name '{firstName}'.");
        }

        return Ok(customers);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerEntity>> Create([FromBody] CustomerEntity customer)
    {
        await _customerService.CreateAsync(customer);
        await _notificationService.NotifyCreated(EntityType.Customer, customer.Id ?? "", customer);
        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CustomerEntity customer)
    {
        var existing = await _customerService.GetAsync(id);
        if (existing == null)
        {
            return NotFound($"Customer with ID {id} not found.");
        }

        customer.Id = id;
        await _customerService.UpdateAsync(id, customer);
        await _notificationService.NotifyUpdated(EntityType.Customer, id, customer);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _customerService.GetAsync(id);
        if (existing == null)
        {
            return NotFound($"Customer with ID {id} not found.");
        }

        await _customerService.DeleteAsync(id);
        await _notificationService.NotifyDeleted(EntityType.Customer, id);
        return NoContent();
    }
    [HttpGet("search")]
    public async Task<ActionResult<List<CustomerEntity>>> Search(
    [FromQuery] string? firstName,
    [FromQuery] string? lastName,
    [FromQuery] string? email,
    [FromQuery] string? phoneNumber,
    [FromQuery] string? address,
    [FromQuery] string? identifyNumber,
    [FromQuery] DateTime? dateOfBirth,
    [FromQuery] string? gender,
    [FromQuery] string? notes,
    [FromQuery] bool partial = false
)
    {
        var customers = await _customerService.SearchAsync(firstName, lastName, email, phoneNumber, address, identifyNumber, dateOfBirth, gender, notes, partial);

        if (customers == null || !customers.Any())
            return NotFound("No matching customers found.");

        return Ok(customers);
    }

}
