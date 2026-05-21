using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace API_VanHungThinh.Models.DTO
{
    public class CreateMergedBillRequest
    {
        [JsonPropertyName("billIds")]
        public List<string> BillIds { get; set; } = new List<string>();
        
        [JsonPropertyName("mergedBillNumber")]
        public string? MergedBillNumber { get; set; }
        
        [JsonPropertyName("status")]
        public string? Status { get; set; }
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
        
        [JsonPropertyName("createdBy")]
        public string? CreatedBy { get; set; }
    }

    public class UpdateMergedBillNotesRequest
    {
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
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