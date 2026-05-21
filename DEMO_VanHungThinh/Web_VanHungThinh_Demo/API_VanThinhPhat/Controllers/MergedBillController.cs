using API_VanHungThinh.Models.DTO;
using API_VanHungThinh.Services.Interface;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MergedBillController : ControllerBase
    {
        private readonly IMergedBillService _mergedBillService;

        public MergedBillController(IMergedBillService mergedBillService)
        {
            _mergedBillService = mergedBillService;
        }

        // POST: api/MergedBill/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateMergedBillAsync([FromBody] CreateMergedBillRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                Console.WriteLine($"[DEBUG] ModelState invalid: {string.Join("; ", errors)}");
                return BadRequest(new { message = "Invalid request", errors });
            }

            Console.WriteLine($"[DEBUG] CreateMergedBillRequest received - BillIds count: {request.BillIds?.Count ?? 0}");
            if (request.BillIds == null)
                Console.WriteLine("[DEBUG] BillIds is null");
            else
                Console.WriteLine($"[DEBUG] BillIds: {string.Join(", ", request.BillIds)}");

            try
            {
                var mergedBill = await _mergedBillService.CreateMergedBillAsync(request);
                return Ok(mergedBill);
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"[DEBUG] ArgumentException: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Exception: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        // GET: api/MergedBill
        [HttpGet]
        public async Task<IActionResult> GetAllMergedBillsAsync()
        {
            var mergedBills = await _mergedBillService.GetAllMergedBillsAsync();
            return Ok(mergedBills);
        }

        // GET: api/MergedBill/{id}
        [HttpGet("{id:length(24)}")]
        public async Task<IActionResult> GetMergedBillByIdAsync(string id)
        {
            var mergedBill = await _mergedBillService.GetMergedBillByIdAsync(id);
            return mergedBill == null ? NotFound() : Ok(mergedBill);
        }

        // PUT: api/MergedBill/{id}
        [HttpPut("{id:length(24)}")]
        public async Task<IActionResult> UpdateMergedBillNotesAsync(string id, [FromBody] UpdateMergedBillNotesRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Invalid request body" });
            }

            var updated = await _mergedBillService.UpdateMergedBillNotesAsync(id, request.Notes ?? string.Empty);
            if (!updated)
            {
                return NotFound(new { message = "Merged bill not found or notes unchanged" });
            }

            return Ok(new { success = true });
        }

        // DELETE: api/MergedBill/{id}
        [HttpDelete("{id:length(24)}")]
        public async Task<IActionResult> DeleteMergedBillAsync(string id)
        {
            var result = await _mergedBillService.DeleteMergedBillAsync(id);
            if (!result)
                return NotFound(new { message = "Merged bill not found" });

            return Ok(new { success = true });
        }
    }
}