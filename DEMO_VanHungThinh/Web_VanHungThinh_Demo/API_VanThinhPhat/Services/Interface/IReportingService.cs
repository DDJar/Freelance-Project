using API_VanHungThinh.Models.DTO.Reports;

namespace API_VanHungThinh.Services.Interface
{
    public interface IReportingService
    {
        Task<RevenueReportData> GetRevenueSummaryAsync(RevenueReportParams parameters);
        Task<InventoryReportData> GetInventoryReportAsync(InventoryReportParams parameters);
        Task<CustomerAgingReportData> GetCustomerAgingAsync(CustomerAgingParams parameters);
    }
}