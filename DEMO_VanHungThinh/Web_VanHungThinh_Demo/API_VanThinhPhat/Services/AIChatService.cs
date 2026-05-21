using API_VanHungThinh.Models.DTO;
using API_VanHungThinh.Services.Interface;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace API_VanHungThinh.Services
{
    public class AIChatService : IAIChatService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _apiUrl;
        private readonly string _model;

        public AIChatService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClient = httpClientFactory.CreateClient();
            _apiKey = GetConfigValue(configuration, "GROQ", "ApiKey") ?? GetConfigValue(configuration, "OpenAI", "ApiKey") ?? string.Empty;
            _apiUrl = GetConfigValue(configuration, "GROQ", "BaseUrl") ?? GetConfigValue(configuration, "OpenAI", "BaseUrl") ?? "https://api.groq.com/openai/v1/chat/completions";
            _model = GetConfigValue(configuration, "GROQ", "Model") ?? GetConfigValue(configuration, "OpenAI", "Model") ?? "llama-3.3-70b-versatile";

            if (_apiUrl.TrimEnd('/').EndsWith("/openai/v1", StringComparison.OrdinalIgnoreCase))
            {
                _apiUrl = $"{_apiUrl.TrimEnd('/')}/chat/completions";
            }
        }

        public async Task<AIChatResponse> AskAsync(AIChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return BuildFallbackResponse(request, "AI provider is not configured.");
            }

            var prompt = BuildPrompt(request);
            var payload = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = "Bạn là trợ lý phân tích kinh tế bằng tiếng Việt. Hãy đọc dữ liệu báo cáo và trả lời đủ rõ ràng, dễ hiểu cho người không chuyên." },
                    new { role = "user", content = prompt }
                },
                max_tokens = 350,
                temperature = 0.3
            };

            var requestContent = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            using var requestMessage = new HttpRequestMessage(HttpMethod.Post, _apiUrl);
            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            requestMessage.Content = requestContent;

            string responseText;
            try
            {
                using var response = await _httpClient.SendAsync(requestMessage);
                responseText = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return BuildFallbackResponse(
                        request,
                        $"AI provider returned {(int)response.StatusCode}: {response.ReasonPhrase}"
                    );
                }
            }
            catch (Exception ex)
            {
                return BuildFallbackResponse(request, $"AI provider request failed: {ex.Message}");
            }

            var answer = ExtractAnswer(responseText);

            return new AIChatResponse
            {
                Answer = answer,
                RawResponse = responseText
            };
        }

        private static string BuildPrompt(AIChatRequest request)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Du lieu bao cao:");

            if (request.ReportData != null)
            {
                builder.AppendLine($"- Tong doanh thu: {FormatCurrency(request.ReportData.Totals.Revenue)}");
                builder.AppendLine($"- So hoa don: {request.ReportData.Totals.BillCount}");
                builder.AppendLine($"- Doanh thu trung binh/hoa don: {FormatCurrency(request.ReportData.Totals.AverageBillValue)}");
                builder.AppendLine($"- Tang truong so voi ky truoc: {request.ReportData.Totals.GrowthRatePct:N2}%");
                builder.AppendLine($"- Doanh thu ky truoc: {FormatCurrency(request.ReportData.Totals.PreviousPeriodRevenue)}");

                if (!IsPlaceholderText(request.ReportData.Totals.BestDay))
                {
                    builder.AppendLine($"- Ngay doanh thu cao nhat: {request.ReportData.Totals.BestDay} ({FormatCurrency(request.ReportData.Totals.BestDayRevenue ?? 0)})");
                }

                if (request.ReportData.Trend?.Any() == true)
                {
                    builder.AppendLine("Trend doanh thu:");
                    foreach (var point in request.ReportData.Trend.Take(6))
                    {
                        var label = IsPlaceholderText(point.Label) ? point.Bucket : point.Label;
                        builder.AppendLine($"  - {label}: {FormatCurrency(point.Revenue)}, {point.BillCount} hoa don");
                    }
                }
            }

            if (request.AgingData != null)
            {
                builder.AppendLine("Du lieu cong no:");
                builder.AppendLine($"- Tong cong no: {FormatCurrency(request.AgingData.Summary.TotalOutstanding)}");
                builder.AppendLine($"- So khach hang no: {request.AgingData.Summary.CustomerCount}");
                builder.AppendLine($"- So hoa don qua han: {request.AgingData.Summary.OverdueCount}");
                builder.AppendLine($"- Trung binh ngay cong no: {request.AgingData.Summary.AvgDaysOutstanding:N1}");

                if (request.AgingData.AgingBuckets?.Any() == true)
                {
                    builder.AppendLine("Phan khoi cong no:");
                    foreach (var bucket in request.AgingData.AgingBuckets)
                    {
                        builder.AppendLine($"  - {bucket.Label}: {FormatCurrency(bucket.Amount)} ({bucket.BillCount} hoa don)");
                    }
                }
            }

            builder.AppendLine();
            builder.AppendLine("Yeu cau:");
            builder.AppendLine(request.Question.Trim());
            builder.AppendLine();
            builder.AppendLine("Hay tra loi ngan gon, de hieu, va neu duoc thi de xuat mot hanh dong uu tien.");

            return builder.ToString();
        }

        private static AIChatResponse BuildFallbackResponse(AIChatRequest request, string reason)
        {
            var builder = new StringBuilder();
            var hasRealReportData = HasRealReportData(request);
            var hasRealAgingData = HasRealAgingData(request);

            builder.AppendLine("Che do phan tich noi bo dang duoc su dung vi chua cau hinh AI provider.");

            if (!hasRealReportData && !hasRealAgingData)
            {
                builder.AppendLine("Request hien tai khong co du lieu bao cao that de phan tich. Neu ban dang thu tren Swagger, hay thay cac gia tri mau nhu 'string' va 0 bang du lieu thuc te, hoac goi tu dashboard sau khi tai bao cao.");

                return new AIChatResponse
                {
                    Answer = builder.ToString().Trim(),
                    RawResponse = reason
                };
            }

            if (hasRealReportData && request.ReportData != null)
            {
                var totals = request.ReportData.Totals;
                builder.AppendLine($"Doanh thu ky nay: {FormatCurrency(totals.Revenue)} tu {totals.BillCount} hoa don.");
                builder.AppendLine($"Gia tri trung binh/hoa don: {FormatCurrency(totals.AverageBillValue)}.");
                builder.AppendLine($"So voi ky truoc: {totals.GrowthRatePct:N2}% ({FormatCurrency(totals.PreviousPeriodRevenue)} ky truoc).");

                if (!IsPlaceholderText(totals.BestDay))
                {
                    builder.AppendLine($"Ngay tot nhat: {totals.BestDay} voi {FormatCurrency(totals.BestDayRevenue ?? 0)}.");
                }

                var topStatus = request.ReportData.Breakdown?.ByStatus?
                    .Where(item => !IsPlaceholderText(item.Status) && (item.Revenue > 0 || item.BillCount > 0))
                    .OrderByDescending(item => item.Revenue)
                    .FirstOrDefault();
                if (topStatus != null)
                {
                    builder.AppendLine($"Trang thai dong gop lon nhat: {topStatus.Status} ({FormatCurrency(topStatus.Revenue)}, {topStatus.BillCount} hoa don).");
                }

                var topChannel = request.ReportData.Breakdown?.ByChannel?
                    .Where(item => !IsPlaceholderText(item.Channel) && (item.Revenue > 0 || item.BillCount > 0))
                    .OrderByDescending(item => item.Revenue)
                    .FirstOrDefault();
                if (topChannel != null)
                {
                    builder.AppendLine($"Kenh thanh toan lon nhat: {topChannel.Channel} ({FormatCurrency(topChannel.Revenue)}, {topChannel.BillCount} hoa don).");
                }

                var topCategory = request.ReportData.Breakdown?.ByCategory?
                    .Where(item => !IsPlaceholderText(item.Category) && (item.Revenue > 0 || item.Quantity > 0))
                    .OrderByDescending(item => item.Revenue)
                    .FirstOrDefault();
                if (topCategory != null)
                {
                    builder.AppendLine($"Category manh nhat: {topCategory.Category} ({FormatCurrency(topCategory.Revenue)}).");
                }
            }

            if (hasRealAgingData && request.AgingData != null)
            {
                var summary = request.AgingData.Summary;
                builder.AppendLine($"Cong no chua thu: {FormatCurrency(summary.TotalOutstanding)}; da thu: {FormatCurrency(summary.TotalCollected)}.");
                builder.AppendLine($"Khach hang dang no: {summary.CustomerCount}; qua han: {summary.OverdueCount}; tuoi no TB: {summary.AvgDaysOutstanding:N1} ngay.");

                var topDebtor = request.AgingData.TopCustomers?
                    .Where(item => !IsPlaceholderText(item.Name) && item.Outstanding > 0)
                    .OrderByDescending(item => item.Outstanding)
                    .FirstOrDefault();
                if (topDebtor != null)
                {
                    builder.AppendLine($"Khach can uu tien nhac no: {topDebtor.Name} ({FormatCurrency(topDebtor.Outstanding)}).");
                }
            }

            builder.AppendLine("Hanh dong uu tien: kiem tra nhom/kenh co doanh thu cao nhat va doi chieu cac hoa don chua thu trong cung ky.");

            return new AIChatResponse
            {
                Answer = builder.ToString().Trim(),
                RawResponse = reason
            };
        }

        private static bool HasRealReportData(AIChatRequest request)
        {
            var report = request.ReportData;
            if (report == null)
                return false;

            var totals = report.Totals;
            if (totals.Revenue > 0 || totals.BillCount > 0 || totals.AverageBillValue > 0 || totals.PreviousPeriodRevenue > 0)
                return true;

            if (report.Trend?.Any(point => point.Revenue > 0 || point.BillCount > 0) == true)
                return true;

            if (report.Breakdown?.ByStatus?.Any(item => !IsPlaceholderText(item.Status) && (item.Revenue > 0 || item.BillCount > 0)) == true)
                return true;

            if (report.Breakdown?.ByChannel?.Any(item => !IsPlaceholderText(item.Channel) && (item.Revenue > 0 || item.BillCount > 0)) == true)
                return true;

            if (report.Breakdown?.ByCategory?.Any(item => !IsPlaceholderText(item.Category) && (item.Revenue > 0 || item.Quantity > 0)) == true)
                return true;

            if (report.Breakdown?.TopCustomers?.Any(item => !IsPlaceholderText(item.Name) && (item.Revenue > 0 || item.BillCount > 0)) == true)
                return true;

            if (report.Breakdown?.TopProducts?.Any(item => !IsPlaceholderText(item.Name) && (item.Revenue > 0 || item.Quantity > 0)) == true)
                return true;

            return false;
        }

        private static bool HasRealAgingData(AIChatRequest request)
        {
            var aging = request.AgingData;
            if (aging == null)
                return false;

            var summary = aging.Summary;
            if (summary.TotalOutstanding > 0 || summary.TotalCollected > 0 || summary.CustomerCount > 0 || summary.OverdueCount > 0)
                return true;

            if (aging.AgingBuckets?.Any(item => !IsPlaceholderText(item.Label) && (item.Amount > 0 || item.BillCount > 0)) == true)
                return true;

            if (aging.TopCustomers?.Any(item => !IsPlaceholderText(item.Name) && (item.Outstanding > 0 || item.BillCount > 0)) == true)
                return true;

            return false;
        }

        private static bool IsPlaceholderText(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ||
                   string.Equals(value.Trim(), "string", StringComparison.OrdinalIgnoreCase);
        }

        private static string FormatCurrency(double value)
        {
            return string.Format(System.Globalization.CultureInfo.GetCultureInfo("vi-VN"), "{0:N0} VND", value);
        }

        private static string? GetConfigValue(IConfiguration configuration, string section, string key)
        {
            var value = configuration[$"{section}:{key}"] ?? Environment.GetEnvironmentVariable($"{section}__{key}");
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        private static string ExtractAnswer(string responseText)
        {
            try
            {
                using var document = JsonDocument.Parse(responseText);
                if (document.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var first = choices[0];
                    if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var content))
                    {
                        return content.GetString() ?? string.Empty;
                    }

                    if (first.TryGetProperty("text", out var text))
                    {
                        return text.GetString() ?? string.Empty;
                    }
                }

                if (document.RootElement.TryGetProperty("output_text", out var outputText))
                {
                    return outputText.GetString() ?? string.Empty;
                }
            }
            catch
            {
                // ignore parse failures
            }

            return responseText;
        }
    }
}
