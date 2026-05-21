import { Delivery, CreateDeliveryRequest } from "../types/delivery";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const deliveryApi = {
  async getAll(): Promise<{ isOk: boolean; data?: Delivery[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Delivery`);
      if (res.ok) return { isOk: true, data: await res.json() };
      return { isOk: false, message: await res.text() };
    } catch (err) {
      console.error("getAll error", err);
      return { isOk: false, message: "Network error" };
    }
  },

  async getById(id: string): Promise<{ isOk: boolean; data?: Delivery; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Delivery/${id}`);
      if (res.ok) return { isOk: true, data: await res.json() };
      return { isOk: false, message: await res.text() };
    } catch (err) {
      return { isOk: false, message: "Network error" };
    }
  },

  async getItemsByBillId(billId: string): Promise<{ isOk: boolean; data?: any[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Delivery/items/${billId}`);
      if (res.ok) return { isOk: true, data: await res.json() };
      return { isOk: false, message: await res.text() };
    } catch (err) {
      return { isOk: false, message: "Network error" };
    }
  },

  async create(request: CreateDeliveryRequest): Promise<{ isOk: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (res.ok) return { isOk: true };
      return { isOk: false, message: await res.text() };
    } catch (err) {
      return { isOk: false, message: "Network error" };
    }
  },

  async update(id: string, request: CreateDeliveryRequest): Promise<{ isOk: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Delivery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (res.ok) return { isOk: true };
      return { isOk: false, message: await res.text() };
    } catch (err) {
      return { isOk: false, message: "Network error" };
    }
  },

  async delete(id: string): Promise<{ isOk: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Delivery/${id}`, {
        method: "DELETE",
      });
      if (res.ok) return { isOk: true };
      return { isOk: false, message: await res.text() };
    } catch (err) {
      return { isOk: false, message: "Network error" };
    }
  },

  async getHistoryByDeliveredBy(deliveredBy: string): Promise<{ isOk: boolean; data?: Delivery[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Delivery/history/delivered-by/${deliveredBy}`);
      if (res.ok) return { isOk: true, data: await res.json() };
      return { isOk: false, message: await res.text() };
    } catch (err) {
      return { isOk: false, message: "Network error" };
    }
  },

  async getHistoryByRecipient(recipient: string): Promise<{ isOk: boolean; data?: Delivery[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Delivery/history/recipient/${recipient}`);
      if (res.ok) return { isOk: true, data: await res.json() };
      return { isOk: false, message: await res.text() };
    } catch (err) {
      return { isOk: false, message: "Network error" };
    }
  },
   async getByDepartment(departmentId: string): Promise<{ isOk: boolean; data?: Delivery[]; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/Delivery/ByDepartment/${departmentId}`);
      if (res.ok) return { isOk: true, data: await res.json() };
      return { isOk: false, message: await res.text() };
    } catch (err) {
      return { isOk: false, message: "Network error" };
    }
  }
};
