
using API_VanHungThinh.Models;
using API_VanHungThinh.Models.DTO;
using API_VanHungThinh.Services;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Hubs;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers;
[ApiController]
[Route("api/[controller]")]
public class DeliveryController : ControllerBase
{
    private readonly IDeliveryService _deliveryService;
    private readonly INotificationService _notificationService;

    public DeliveryController(IDeliveryService deliveryService, INotificationService notificationService)
    {
        _deliveryService = deliveryService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _deliveryService.GetAllDeliveriesAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var delivery = await _deliveryService.GetDeliveryByIdAsync(id);
        return delivery == null ? NotFound() : Ok(delivery);
    }

    [HttpGet("items/{billId}")]
    public async Task<IActionResult> GetItemsByBillId(string billId)
    {
        var items = await _deliveryService.GetItemsWithProductNameByBillIdAsync(billId);
        if (items == null || !items.Any())
            return NotFound($"No bill items found for Bill ID: {billId}");

        return Ok(items);
    }


    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDeliveryRequest request)
    {
        var result = await _deliveryService.CreateDeliveryAsync(request);
        if (result)
        {
            await _notificationService.NotifyCreated(EntityType.Delivery, "", request);
        }
        return result ? Ok("Created") : BadRequest("Failed to create delivery");
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateDeliveryRequest request)
    {
        var result = await _deliveryService.UpdateDeliveryAsync(id, request);
        if (result)
        {
            await _notificationService.NotifyUpdated(EntityType.Delivery, id, request);
        }
        return result ? Ok("Updated") : NotFound("Not found or update failed");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _deliveryService.DeleteDeliveryAsync(id);
        if (result)
        {
            await _notificationService.NotifyDeleted(EntityType.Delivery, id);
        }
        return result ? Ok("Deleted") : NotFound("Not found or delete failed");
    }
    [HttpGet("history/delivered-by/{deliveredBy}")]
    public async Task<IActionResult> GetHistoryByDeliveredBy(string deliveredBy)
    {
        var deliveries = await _deliveryService.GetDeliveriesByDeliveredByAsync(deliveredBy);
        return Ok(deliveries);
    }

    [HttpGet("history/recipient/{recipient}")]
    public async Task<IActionResult> GetHistoryByRecipient(string recipient)
    {
        var deliveries = await _deliveryService.GetDeliveriesByRecipientAsync(recipient);
        return Ok(deliveries);
    }
    [HttpGet("ByDepartment/{departmentId}")]
    public async Task<ActionResult<List<Delivery>>> GetByDepartmentId(string departmentId)
    {
        try
        {
            var deliveries = await _deliveryService.GetDeliveriesByDepartmentIdAsync(departmentId);
            return Ok(deliveries);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

}
