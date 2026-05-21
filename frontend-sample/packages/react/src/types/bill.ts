export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  total: number;
  name?: string;
  category?: string; // thêm category
}

export interface BillItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
  name?: string;
  category?: string; // thêm category
}

export interface CreateBillRequest {
  customerId: string;
  totalAmount: number;
  billDate: string;
  paymentMethod: string;
  status: string;
  notes: string;
  items: CartItem[];
}

export interface BillSearchRequest {
  minTotalAmount?: number;
  maxTotalAmount?: number;
  timeRange?: string;
  paymentMethod?: string;
  status?: string;
}
export interface Bill {
  id?: string;
  identifyNumber: string;
  totalAmount: number;
  billDate: string;
  paymentMethod: string;
  status: string;
  notes: string;
  email: string;
  firstName: string;
  lastName: string;
  //gender?: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  items?: CartItem[];
}

export interface BillRes {
  id: string;
  identifyNumber: string;
  totalAmount: number;
  billDate: string;
  paymentMethod: string;
  status: string;
  notes: string;
  email: string;
  firstName: string;
  lastName: string;
  //gender: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  items?: CartItem[];
}


// Interfaces cho dữ liệu
export interface RevenueChartData {
  date: string;
  dateDisplay: string;
  revenue: number;
  billCount: number;
  averageAmount: number;
  rawBills?: Bill[];
}

export interface RevenueStats {
  totalRevenue: number;
  totalBills: number;
  averageRevenue: number;
  previousPeriodRevenue: number;
  growthRate: number;
  bestDay: string;
  bestDayRevenue: number;
}
export interface SendEmail {
  toEmail: string,
  customerName: string,
  orderDetails: string

}
export const transformBillsToCategoryRevenue = (bills: Bill[]): {
  month: string;
  [category: string]: number | string;
}[] => {
  const result: Record<string, Record<string, number>> = {};

  bills.forEach((bill) => {
    const month = bill.billDate.slice(0, 7);
    if (!result[month]) result[month] = {};

    bill.items?.forEach((item) => {
      let category = item.category ?? "Khác";
      if (typeof category === "string") {
        category = category.trim();
        if (category === "") category = "Khác";
      }

      const revenue = item.quantity * item.price;

      if (!result[month][category]) result[month][category] = 0;
      result[month][category] += revenue;
    });
  });

  return Object.entries(result).map(([month, categories]) => ({
    month,
    ...categories,
  }));
};
