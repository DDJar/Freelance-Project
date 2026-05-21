import { Bill, BillItem, BillSearchRequest, CartItem, SendEmail } from "../types/bill";
import { Product } from "../types/product";
import enrichBillsWithProductInfo from "../utils/enrichBills";
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const billApi = {
  async getAll(): Promise<{ isOk: boolean; data?: Bill[]; message?: string }> {
    try {
      const [billsRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/Bill`),
        fetch(`${API_BASE_URL}/Product`),
      ]);

      if (!billsRes.ok) {
        return { isOk: false, message: await billsRes.text() };
      }
      if (!productsRes.ok) {
        return { isOk: false, message: await productsRes.text() };
      }

      const bills: Bill[] = await billsRes.json();
      const products: Product[] = await productsRes.json();

      const enrichedBills = enrichBillsWithProductInfo(bills, products);

      return { isOk: true, data: enrichedBills };
    } catch (err) {
      console.error("Get all bills error:", err);
      return { isOk: false, message: "Network error" };
    }
  },

  async getById(
    id: string
  ): Promise<{ isOk: boolean; data?: Bill; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Bill/${id}`);
      if (res.ok) {
        const data: Bill = await res.json();
        return { isOk: true, data };
      }
      return { isOk: false, message: await res.text() };
    } catch (err) {
      console.error("Get bill by ID error:", err);
      return { isOk: false, message: "Network error" };
    }
  },

  async getItems(
    id: string
  ): Promise<{ isOk: boolean; data?: CartItem[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}//Bill/${id}/items`);
      if (res.ok) {
        const data: CartItem[] = await res.json();
        return { isOk: true, data };
      }
      return { isOk: false, message: await res.text() };
    } catch (err) {
      console.error("Get bill items error:", err);
      return { isOk: false, message: "Network error" };
    }
  },

  async search(
    request: BillSearchRequest
  ): Promise<{ isOk: boolean; data?: Bill[]; message?: string }> {
    try {
      const params = new URLSearchParams();
      if (request.minTotalAmount !== undefined)
        params.append("minTotalAmount", request.minTotalAmount.toString());
      if (request.maxTotalAmount !== undefined)
        params.append("maxTotalAmount", request.maxTotalAmount.toString());
      if (request.timeRange) params.append("timeRange", request.timeRange);
      if (request.paymentMethod)
        params.append("paymentMethod", request.paymentMethod);
      if (request.status) params.append("status", request.status);

      const res = await fetch(
        `${API_BASE_URL}/Bill/search?${params.toString()}`
      );
      if (res.ok) {
        const data: Bill[] = await res.json();
        return { isOk: true, data };
      }
      return { isOk: false, message: await res.text() };
    } catch (err) {
      console.error("Search bills error:", err);
      return { isOk: false, message: "Network error" };
    }
  },

  async updateStatus(
    id: string,
    newStatus: string
  ): Promise<{ isOk: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Bill/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStatus),
      });
      if (res.ok) {
        return { isOk: true, message: await res.text() };
      }
      return { isOk: false, message: await res.text() };
    } catch (err) {
      console.error("Update status error:", err);
      return { isOk: false, message: "Network error" };
    }
  },
  async create(
    billItems: Partial<Bill>
  ): Promise<{ isOk: boolean; data?: Bill; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/Bill/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billItems),
      });

      if (response.ok) {
        const createdBillItems: Bill = await response.json();

        return {
          isOk: true,
          data: createdBillItems,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || "Failed to create bill",
        };
      }
    } catch (error) {
      console.error("Create bill error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  async updateBillItemByBillId(
    id: string,
    billItems: Partial<BillItem>[]
  ): Promise<{ isOk: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/Bill/${id}/items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billItems),
      });
      console.log(response);

      if (response.ok) {
        return {
          isOk: true,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || "Failed to update bill items",
        };
      }
    } catch (error) {
      console.error("Update bill items error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },

  // Delete billItems
  async delete(id: string): Promise<{ isOk: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/BillItems/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return {
          isOk: true,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || "Failed to delete billItems",
        };
      }
    } catch (error) {
      console.error("Delete billItems error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },
  async deleteBill(id: string): Promise<{ isOk: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/Bill/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return {
          isOk: true,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || "Failed to delete billItems",
        };
      }
    } catch (error) {
      console.error("Delete billItems error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  },
  async getByDepartment(departmentId?: string): Promise<{
    isOk: boolean;
    data?: Bill[];
    message?: string;
  }> {
    try {
      const [billsRes, productsRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/Bill/GetBillsByDepartment/${departmentId ?? ""}`
        ),
        fetch(`${API_BASE_URL}/Product`),
      ]);

      if (!billsRes.ok) {
        return { isOk: false, message: await billsRes.text() };
      }
      if (!productsRes.ok) {
        return { isOk: false, message: await productsRes.text() };
      }

      const bills: Bill[] = await billsRes.json();
      const products: Product[] = await productsRes.json();

      const enrichedBills = enrichBillsWithProductInfo(bills, products);

      return { isOk: true, data: enrichedBills };
    } catch (error: any) {
      console.error("Error fetching bills by department:", error);
      return {
        isOk: false,
        message: error.message || "Unknown error",
      };
    }
  },
  async lookupBill(email: string, billId: string): Promise<{ isOk: boolean; data?: Bill; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Bill/lookup?email=${email}&billId=${billId}`);
      if (res.ok) {
        const data: Bill = await res.json();
        return { isOk: true, data };
      }
      return { isOk: false, message: await res.text() };
    } catch (err) {
      console.error("Lookup bill error:", err);
      return { isOk: false, message: "Network error" };
    }
  },
  async sendNotify(
    dataEmail: Partial<SendEmail>
  ): Promise<{ isOk: boolean; data?: SendEmail; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/Bill/send-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataEmail),
      });

      if (response.ok) {
        const sendEmail = await response.text();

        return {
          isOk: true,
          message: sendEmail,
        };
      } else {
        const errorText = await response.text();
        return {
          isOk: false,
          message: errorText || "Failed to send mail",
        };
      }
    } catch (error) {
      console.error("Send email error:", error);
      return {
        isOk: false,
        message: "Network error. Please try again.",
      };
    }
  }
};
