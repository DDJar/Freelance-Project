using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace API_VanHungThinh.Models
{
    public class InventoryHistory
    {
        [BsonId]
        public ObjectId Id { get; set; } = ObjectId.GenerateNewId();
        [BsonElement("productId")]
        public string ProductId { get; set; }

        [BsonElement("quantityChanged")]
        public int QuantityChanged { get; set; } // + hoặc -

        [BsonElement("actionType")]
        public string ActionType { get; set; } // eg: "ManualUpdate", "Order", "Restock"

        [BsonElement("actionDate")]
        public DateTime ActionDate { get; set; }

        [BsonElement("idDepartment")]
        public string IdDepartment { get; set; }
    }
    public class UpdateInventoryRequest
    {
        public string ProductId { get; set; }
        public int QuantityChanged { get; set; } // + tăng, - giảm
    }
    public class InventoryReportFilter
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? DepartmentId { get; set; }
        public string? ActionType { get; set; }
        public string GroupBy { get; set; } = "daily";
    }


    public class InventoryReportResult
    {
        public string? ProductId { get; set; }
        public string? GroupDate { get; set; }
        public string? DepartmentId { get; set; }
        public string? ActionType { get; set; }
        public int TotalQuantityChanged { get; set; }
    }


}
