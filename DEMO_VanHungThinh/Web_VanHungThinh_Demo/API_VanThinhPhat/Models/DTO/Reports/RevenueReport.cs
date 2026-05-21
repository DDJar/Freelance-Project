using System;

namespace API_VanHungThinh.Models.DTO.Reports
{
    public class RevenueReportParams
    {
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string? DepartmentId { get; set; }
        public string? Channel { get; set; }
        public string? Status { get; set; }
    }

    public class RevenueReportFilters
    {
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string? DepartmentId { get; set; }
        public string? Channel { get; set; }
        public string? Status { get; set; }
    }

    public class RevenueTotals
    {
        public double Revenue { get; set; }
        public int BillCount { get; set; }
        public double AverageBillValue { get; set; }
        public double GrowthRatePct { get; set; }
        public double PreviousPeriodRevenue { get; set; }
        public string? BestDay { get; set; }
        public double? BestDayRevenue { get; set; }
    }

    public class RevenueTrendPoint
    {
        public string Bucket { get; set; } = string.Empty;
        public string? Label { get; set; }
        public double Revenue { get; set; }
        public int BillCount { get; set; }
        public double AverageBillValue { get; set; }
    }

    public class RevenueStatusSlice
    {
        public string Status { get; set; } = string.Empty;
        public int BillCount { get; set; }
        public double Revenue { get; set; }
    }

    public class RevenueChannelSlice
    {
        public string Channel { get; set; } = string.Empty;
        public int BillCount { get; set; }
        public double Revenue { get; set; }
    }

    public class RevenueCustomerSlice
    {
        public string CustomerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public double Revenue { get; set; }
        public int BillCount { get; set; }
        public DateTime? LastBillDate { get; set; }
    }

    public class RevenueProductSlice
    {
        public string ProductId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public double Revenue { get; set; }
    }

    public class RevenueCategorySlice
    {
        public string Category { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public double Revenue { get; set; }
    }

    public class RevenueCategoryTrendPoint
    {
        public string Month { get; set; } = string.Empty;
        public Dictionary<string, double> Categories { get; set; } = new();
    }

    public class RevenueBreakdown
    {
        public List<RevenueStatusSlice>? ByStatus { get; set; }
        public List<RevenueChannelSlice>? ByChannel { get; set; }
        public List<RevenueCategorySlice>? ByCategory { get; set; }
        public List<RevenueCustomerSlice>? TopCustomers { get; set; }
        public List<RevenueProductSlice>? TopProducts { get; set; }
    }

    public class RevenueReportData
    {
        public RevenueReportFilters Filters { get; set; } = new();
        public RevenueTotals Totals { get; set; } = new();
        public List<RevenueTrendPoint> Trend { get; set; } = new();
        public List<RevenueCategoryTrendPoint> CategoryTrend { get; set; } = new();
        public RevenueBreakdown? Breakdown { get; set; }
    }
}
