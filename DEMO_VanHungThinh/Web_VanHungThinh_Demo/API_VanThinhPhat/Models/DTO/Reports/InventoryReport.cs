using System;

namespace API_VanHungThinh.Models.DTO.Reports
{
    public class InventoryReportParams
    {
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string? DepartmentId { get; set; }
        public string? GroupBy { get; set; } = "daily";
        public string? ActionType { get; set; }
    }

    public class InventorySummary
    {
        public int TotalInbound { get; set; }
        public int TotalOutbound { get; set; }
        public int NetChange { get; set; }
        public int MovementCount { get; set; }
        public int UniqueSkus { get; set; }
        public double? InventoryValue { get; set; }
    }

    public class InventoryTrendPoint
    {
        public string Bucket { get; set; } = string.Empty;
        public int Inbound { get; set; }
        public int Outbound { get; set; }
        public int? Returns { get; set; }
    }

    public class InventorySkuEntry
    {
        public string ProductId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int NetChange { get; set; }
        public int? CurrentQuantity { get; set; }
        public int? SafetyStock { get; set; }
        public double? DaysOfSupply { get; set; }
    }

    public class InventoryLowStockEntry
    {
        public string ProductId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CurrentQuantity { get; set; }
        public int? SafetyStock { get; set; }
        public double? DaysOfSupply { get; set; }
    }

    public class InventoryAnomalyEntry
    {
        public string MovementId { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public int QuantityChanged { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public DateTime ActionDate { get; set; }
        public string? Note { get; set; }
    }

    public class InventoryReportData
    {
        public InventorySummary Summary { get; set; } = new();
        public List<InventoryTrendPoint> Trend { get; set; } = new();
        public List<InventorySkuEntry>? TopSkus { get; set; }
        public List<InventoryLowStockEntry>? LowStockAlerts { get; set; }
        public List<InventoryAnomalyEntry>? Anomalies { get; set; }
    }
}