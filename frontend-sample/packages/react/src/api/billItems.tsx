import { BillItem } from "../types/bill";
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const billItemsApi = {
    // Get all billItems
    async getAll(): Promise<{ isOk: boolean; data?: BillItem[]; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/BillItem`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const billItems: BillItem[] = await response.json();
                return {
                    isOk: true,
                    data: billItems,
                };
            } else {
                const errorText = await response.text();
                return {
                    isOk: false,
                    message: errorText || "Failed to fetch bill item",
                };
            }
        } catch (error) {
            console.error("Get bill item error:", error);
            return {
                isOk: false,
                message: "Network error. Please try again.",
            };
        }
    },

    async getById(
        id: string
    ): Promise<{ isOk: boolean; data?: BillItem; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/billItems/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const billItems: BillItem = await response.json();
                return {
                    isOk: true,
                    data: billItems,
                };
            } else {
                const errorText = await response.text();
                return {
                    isOk: false,
                    message: errorText || "billItems not found",
                };
            }
        } catch (error) {
            console.error("Get billItems error:", error);
            return {
                isOk: false,
                message: "Network error. Please try again.",
            };
        }
    },



    async create(
        billItems: Partial<BillItem>
    ): Promise<{ isOk: boolean; data?: BillItem; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/BillItem`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(billItems),
            });

            if (response.ok) {
                const createdBillItems: BillItem = await response.json();

                return {
                    isOk: true,
                    data: createdBillItems,
                };
            } else {
                const errorText = await response.text();
                return {
                    isOk: false,
                    message: errorText || "Failed to create billItems",
                };
            }
        } catch (error) {
            console.error("Create billItems error:", error);
            return {
                isOk: false,
                message: "Network error. Please try again.",
            };
        }
    },

    async update(
        id: string,
        billItems: Partial<BillItem>
    ): Promise<{ isOk: boolean; data?: BillItem; message?: string }> {
        try {
            const backendbillItems = {
                ...billItems,
                quantity: billItems.quantity,
                total: billItems.total
            };

            const response = await fetch(`${API_BASE_URL}/BillItem/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(backendbillItems),
            });

            if (response.ok) {
                const result = await response.json();

                const updateBillItems: BillItem = await result.data;
                return {
                    isOk: true,
                    data: updateBillItems,
                };
            } else {
                const errorText = await response.text();
                return {
                    isOk: false,
                    message: errorText || "Failed to update billItems",
                };
            }
        } catch (error) {
            console.error("Update billItems error:", error);
            return {
                isOk: false,
                message: "Network error. Please try again.",
            };
        }
    },



    // Delete billItems
    async delete(id: string): Promise<{ isOk: boolean; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/BillItem/${id}`, {
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
};
