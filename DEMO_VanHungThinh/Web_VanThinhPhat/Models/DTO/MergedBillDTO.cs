using System;
using System.Collections.Generic;

namespace API_VanHungThinh.Models.DTO
{
    public class CreateMergedBillRequest
    {
        public List<string> BillIds { get; set; } = new List<string>();
        public string? MergedBillNumber { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public string? CreatedBy { get; set; }
    }

    public class MergedBillDTO
    {
        public string? Id { get; set; }
        public string? MergedBillNumber { get; set; }
        public List<string> BillIds { get; set; } = new List<string>();
        public double TotalAmount { get; set; }
        public DateTime MergedDate { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public MergedBillCustomerInfo? CustomerInfo { get; set; }
        public string? CreatedBy { get; set; }
        public List<BillWithItemsDTO>? Bills { get; set; }
    }
}