export type DeliveryStatus = "Đang chờ" | "Đã giao" | "Đã hủy";

export interface Delivery {
  id?: string;
  billId: string;
  deliveryDate: Date;
  deliveredBy: string;
  recipient: string;
  status: string;
  notes?: string;
}


export interface CreateDeliveryRequest {
  billId: string;
  deliveryDate: Date;
  deliveredBy: string;
  recipient: string;
  status: DeliveryStatus;
  notes?: string;
}
