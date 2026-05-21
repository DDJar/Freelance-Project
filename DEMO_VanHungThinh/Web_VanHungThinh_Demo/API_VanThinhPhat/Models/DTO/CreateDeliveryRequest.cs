namespace API_VanHungThinh.Models.DTO
{
    public class CreateDeliveryRequest
    {
        public string BillId { get; set; }
        public DateTime DeliveryDate { get; set; }
        public string DeliveredBy { get; set; }
        public string Recipient { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
    }

}
