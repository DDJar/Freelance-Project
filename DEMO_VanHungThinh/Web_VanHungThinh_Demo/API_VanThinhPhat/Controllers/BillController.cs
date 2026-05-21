using API_VanHungThinh.Models;
using API_VanHungThinh.Models.DTO;
using API_VanHungThinh.Services;
using API_VanHungThinh.Services.Interface;
using API_VanHungThinh.Hubs;
using Microsoft.AspNetCore.Mvc;

namespace API_VanHungThinh.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillController : ControllerBase
    {
        private readonly IBillService _billService;
        private readonly EmailService _emailService;
        private readonly INotificationService _notificationService;
        private readonly IStatusBillHistoryService _statusBillHistoryService;

        public BillController(IBillService billService, EmailService emailService, INotificationService notificationService, IStatusBillHistoryService statusBillHistoryService)
        {
            _billService = billService;
            _emailService = emailService;
            _notificationService = notificationService;
            _statusBillHistoryService = statusBillHistoryService;
        }

        // POST: api/Bill/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateBillAsync([FromBody] CreateBillRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                if (request.Items != null && request.Items.Any())
                {
                    var billWithItems = await _billService.CreateBillWithItemsAsync(request);
                    await _notificationService.NotifyCreated(EntityType.Bill, billWithItems.Id ?? string.Empty, billWithItems);
                    return Ok(billWithItems);
                }

                var bill = await _billService.CreateBillOnlyAsync(request);
                if (bill == null)
                    return BadRequest(new { message = "Unable to create bill." });

                await _notificationService.NotifyCreated(EntityType.Bill, bill.Id ?? string.Empty, bill);
                return Ok(bill);
            }
            catch (Exception ex)
            {
                var msg = ex.Message ?? "Internal server error";
                if (msg.Contains("Sản phẩm") || msg.Contains("không tồn tại") || msg.Contains("không đủ"))
                {
                    return BadRequest(new { message = msg });
                }
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/Bill/{billId}/items
        [HttpPut("{billId}/items")]
        public async Task<IActionResult> UpdateBillItemsAsync(string billId, [FromBody] List<CreateBillItemRequest> items)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _billService.UpdateBillItemsAsync(billId, items);
            if (!result)
                return BadRequest("Failed to update bill items or insufficient stock.");

            return Ok(new
            {
                message = "Bill items updated successfully.",
                data = items
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBill(string id, [FromBody] UpdateBillRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _billService.UpdateBillAsync(id, request);
            if (!result)
                return BadRequest(new { message = "Failed to update bill." });

            await _notificationService.NotifyUpdated(EntityType.Bill, id);
            return Ok(new { message = "Bill updated successfully." });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 1000) pageSize = 50;

            var (bills, totalCount) = await _billService.GetAllBillsAsync(page, pageSize);
            return Ok(new {
                data = bills,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("{id:length(24)}")]
        public async Task<IActionResult> GetById(string id)
        {
            var bill = await _billService.GetBillByIdAsync(id);
            return bill == null ? NotFound() : Ok(bill);
        }

        [HttpGet("{id:length(24)}/details")]
        public async Task<IActionResult> GetDetails(string id)
        {
            var details = await _billService.GetBillDetailsAsync(id);
            return details == null ? NotFound() : Ok(details);
        }

        [HttpGet("{id}/items")]
        public async Task<IActionResult> GetItems(string id)
        {
            var items = await _billService.GetBillItemsAsync(id);
            return Ok(items);
        }
        [HttpGet("search")]
        public async Task<ActionResult<List<BillEntity>>> SearchBills([FromQuery] BillSearchRequest request)
        {
            var results = await _billService.SearchBillsAsync(
                request.MinTotalAmount,
                request.MaxTotalAmount,
                request.TimeRange,
                request.PaymentMethod,
                request.Status
            );
            return Ok(results);
        }
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus([FromRoute] string id,[FromBody] UpdateBillStatusRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _billService.UpdateBillStatusAsync(id, request.NewStatus,request.NewAddress);

            if (result)
            {
                await _notificationService.NotifyUpdated(EntityType.Bill, id);
            }
            return result ? Ok() : BadRequest("Invalid status or bill ID");
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBill(string id, [FromQuery] bool restoreInventory = false)
        {
            var result = await _billService.DeleteBillAsync(id, restoreInventory);
            if (!result)
                return NotFound(new { message = "Không tìm thấy hóa đơn" });

            await _notificationService.NotifyDeleted(EntityType.Bill, id);
            return Ok(new { success = true, restoreInventory });
        }

        [HttpGet("GetBillsByDepartment/{departmentId}")]
        public async Task<IActionResult> GetBillsByDepartment(string? departmentId)
        {
            var bills = await _billService.GetBillsByDepartmentAsync(departmentId);
            return Ok(bills);
        }
        [HttpGet("lookup")]
        public async Task<IActionResult> LookupBill([FromQuery] string email, [FromQuery] string billId)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(billId))
                return BadRequest(new { message = "Thiếu email hoặc mã đơn hàng." });

            var result = await _billService.LookupBillAsync(email, billId);
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng tương ứng." });
            }

            return Ok(result);
        }

        [HttpPost("fix-missing-invoice-numbers")]
        public async Task<IActionResult> FixMissingInvoiceNumbers()
        {
            var updatedCount = await _billService.FixMissingInvoiceNumbersAsync();
            if (updatedCount == 0)
            {
                return Ok(new { message = "Không có hóa đơn thiếu số hóa đơn.", updatedCount });
            }

            return Ok(new { message = $"Đã cập nhật {updatedCount} hóa đơn thiếu số hóa đơn.", updatedCount });
        }

        [HttpGet("{billId}/status-history")]
        public async Task<IActionResult> GetStatusHistory(string billId)
        {
            if (string.IsNullOrWhiteSpace(billId))
                return BadRequest(new { message = "Thiếu billId" });

            var history = await _statusBillHistoryService.GetBillStatusHistoryAsync(billId);
            return Ok(new { data = history });
        }

        [HttpPost("send-confirmation")]
        public async Task<IActionResult> SendOrderConfirmation([FromBody] OrderEmailRequest request)
        {
            if (string.IsNullOrEmpty(request.ToEmail) || string.IsNullOrEmpty(request.CustomerName))
            {
                return BadRequest("Missing required fields.");
            }

            await _emailService.SendOrderConfirmationEmail(
                request.ToEmail,
                request.CustomerName,
                request.OrderDetails ?? "Không có chi tiết đơn hàng."
            );

            return Ok("Email xác nhận đơn hàng đã được gửi.");
        }
    }

}
