using API_VanHungThinh.Models.DTO.Reports;
using API_VanHungThinh.Services.Interface;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportingService _reportingService;

        public ReportsController(IReportingService reportingService)
        {
            _reportingService = reportingService;
        }

        // GET: api/reports/revenue
        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenueSummary([FromQuery] RevenueReportParams parameters)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _reportingService.GetRevenueSummaryAsync(parameters);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/reports/inventory
        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventoryReport([FromQuery] InventoryReportParams parameters)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _reportingService.GetInventoryReportAsync(parameters);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: api/reports/customer-aging
        [HttpGet("customer-aging")]
        public async Task<IActionResult> GetCustomerAging([FromQuery] CustomerAgingParams parameters)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _reportingService.GetCustomerAgingAsync(parameters);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}