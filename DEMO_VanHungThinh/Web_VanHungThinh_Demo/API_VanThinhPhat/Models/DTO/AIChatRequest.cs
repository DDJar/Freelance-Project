using API_VanHungThinh.Models.DTO.Reports;

namespace API_VanHungThinh.Models.DTO
{
    public class AIChatRequest
    {
        public string Question { get; set; } = string.Empty;
        public RevenueReportData? ReportData { get; set; }
        public CustomerAgingReportData? AgingData { get; set; }
    }
}
