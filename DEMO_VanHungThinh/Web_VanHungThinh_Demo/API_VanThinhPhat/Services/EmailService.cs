using API_VanHungThinh.Models;
using API_VanHungThinh.Services.Interface;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Text;

namespace API_VanHungThinh.Services
{
    public class EmailService
    {
        private readonly SmtpSettings _smtpSettings;
        private readonly IBillItemService _billItemService;

        public EmailService(IOptions<SmtpSettings> smtpSettings, IBillItemService billItemService)
        {
            _smtpSettings = smtpSettings.Value;
            _billItemService = billItemService;
        }

        public async Task SendOrderConfirmationEmail(string toEmail, string customerName, string billId)
        {
            try
            {
                // Lấy danh sách BillItem kèm Product
                var items = await _billItemService.GetItemsWithProductByBillIdAsync(billId);

                if (items == null || !items.Any())
                {
                    throw new Exception("Không tìm thấy chi tiết đơn hàng.");
                }

                var table = new StringBuilder();
                table.AppendLine("<table border='1' cellpadding='6' style='border-collapse:collapse; width:100%; font-family:sans-serif;'>");
                table.AppendLine("<thead><tr><th>Tên SP</th><th>Danh mục</th><th>Đơn vị</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>");
                table.AppendLine("<tbody>");

                decimal totalAmount = 0m; 

                foreach (var (item, product) in items)
                {
                    var productName = product?.Name ?? "N/A";
                    var category = product?.Category ?? "N/A";
                    var unit = product?.Unit ?? "N/A";
                    var quantity = item?.Quantity ?? 0;

                    
                    decimal price = Convert.ToDecimal(item?.Price ?? 0);

                    // Ép kiểu total về decimal
                    decimal total = Convert.ToDecimal(item?.Total ?? 0);

                    totalAmount += total;

                    table.AppendLine($@"
                <tr>
                    <td>{System.Net.WebUtility.HtmlEncode(productName)}</td>
                    <td>{System.Net.WebUtility.HtmlEncode(category)}</td>
                    <td>{System.Net.WebUtility.HtmlEncode(unit)}</td>
                    <td style='text-align:center'>{quantity}</td>
                    <td style='text-align:right'>{price:N0}₫</td>
                    <td style='text-align:right'>{total:N0}₫</td>
                </tr>");
                }

                table.AppendLine($@"
            <tr>
                <td colspan='5' style='text-align:right; font-weight:bold'>Tổng cộng:</td>
                <td style='text-align:right; font-weight:bold'>{totalAmount:N0}₫</td>
            </tr>");

                table.AppendLine("</tbody></table>");

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_smtpSettings.SenderName, _smtpSettings.Username));
                message.To.Add(new MailboxAddress(customerName, toEmail));
                message.Subject = $"Xác nhận đơn hàng #{billId}";

                message.Body = new TextPart("html")
                {
                    Text = $@"
                    <h2>Chào {System.Net.WebUtility.HtmlEncode(customerName)},</h2>
                    <p>Chúng tôi đã nhận đơn hàng <strong>#{billId}</strong> của bạn. Dưới đây là chi tiết đơn hàng:</p>
                    {table}
                    <p>Cảm ơn bạn đã chọn mua hàng tại <strong>{System.Net.WebUtility.HtmlEncode(_smtpSettings.SenderName)}</strong>.</p>
                    <p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.</p>
                    <hr style='margin:20px 0;' />

                    <div style='font-family: Arial, sans-serif; color: #222; font-size: 14px;'>
                        <strong style='font-size: 16px; color: #003366;'>Trương Gia Thịnh Cooperation</strong><br/>
                        <span>Phone: <span style='color:#555;'>0925 067 999 - 0982970777</span></span><br/>
                        <span>Email: <a href='mailto:truonggiathinhcoop@gmail.com' style='color:#1a73e8; text-decoration:none;'>truonggiathinhcoop@gmail.com</a></span><br/>
                        <span>Website: <a href='https://truonggiathinh.com' target='_blank' style='color:#1a73e8; text-decoration:none;'>truonggiathinh.com</a></span>
                    </div>"
                };


                using var client = new SmtpClient();

                await client.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_smtpSettings.Username, _smtpSettings.Password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                // Log lỗi hoặc xử lý tùy theo logic của bạn
                throw new InvalidOperationException($"Gửi email xác nhận đơn hàng thất bại: {ex.Message}", ex);
            }
        }

    }
}
