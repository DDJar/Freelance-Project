using System;

namespace API_VanHungThinh.Models.DTO.Reports
{
    public class CustomerAgingParams
    {
        public string? DepartmentId { get; set; }
        public string? CustomerId { get; set; }
        public int? BucketSize { get; set; } = 30;
        public string? Status { get; set; }
    }

    public class CustomerAgingSummary
    {
        public double TotalOutstanding { get; set; }
        public double TotalCollected { get; set; }
        public int CustomerCount { get; set; }
        public int OverdueCount { get; set; }
        public double AvgDaysOutstanding { get; set; }
    }

    public class CustomerAgingBucket
    {
        public string Label { get; set; } = string.Empty;
        public double Amount { get; set; }
        public int BillCount { get; set; }
    }

    public class CustomerAgingCustomer
    {
        public string CustomerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public double Outstanding { get; set; }
        public int BillCount { get; set; }
        public DateTime? LastPayment { get; set; }
    }

    public class CustomerLedgerBill
    {
        public string BillId { get; set; } = string.Empty;
        public DateTime BillDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public double Amount { get; set; }
        public int DaysOutstanding { get; set; }
    }

    public class CustomerLedgerPayment
    {
        public string PaymentId { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public double Amount { get; set; }
        public string? Method { get; set; }
    }

    public class CustomerLedger
    {
        public string CustomerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public double TotalOutstanding { get; set; }
        public int PaidCount { get; set; }
        public List<CustomerLedgerBill> OpenBills { get; set; } = new();
        public List<CustomerLedgerPayment> Payments { get; set; } = new();
    }

    public class CustomerAgingReportData
    {
        public CustomerAgingSummary Summary { get; set; } = new();
        public List<CustomerAgingBucket> AgingBuckets { get; set; } = new();
        public List<CustomerAgingCustomer> TopCustomers { get; set; } = new();
        public CustomerLedger? Ledger { get; set; }
    }
}