import { CreateProductDTO, Product } from "../types/product";
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
export const productApi = {
    async getAll(): Promise<{ isOk: boolean; data?: Product[]; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/Product`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const products: Product[] = await response.json();
                return { isOk: true, data: products };
            } else {
                const errorText = await response.text();
                return { isOk: false, message: errorText || 'Failed to fetch products' };
            }
        } catch (error) {
            console.error('Get all products error:', error);
            return { isOk: false, message: 'Network error. Please try again.' };
        }
    },

    async getById(id: string): Promise<{ isOk: boolean; data?: Product; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/Product/${id}`);
            if (response.ok) {
                const product: Product = await response.json();
                return { isOk: true, data: product };
            } else {
                const errorText = await response.text();
                return { isOk: false, message: errorText || 'Product not found' };
            }
        } catch (error) {
            console.error('Get product by ID error:', error);
            return { isOk: false, message: 'Network error. Please try again.' };
        }
    },

    async create(product: CreateProductDTO): Promise<{ isOk: boolean; data?: Product; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/Product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product),
            });
            if (response.ok) {
                const created = await response.json();
                return { isOk: true, data: created };
            } else {
                const errorText = await response.text();
                return { isOk: false, message: errorText || 'Failed to create product' };
            }
        } catch (error) {
            console.error('Create product error:', error);
            return { isOk: false, message: 'Network error. Please try again.' };
        }
    },

    async update(id: string, product: Product): Promise<{ isOk: boolean; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/Product/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product),
            });

            if (response.ok) {
                return { isOk: true };
            } else {
                const errorText = await response.text();
                return { isOk: false, message: errorText || 'Failed to update product' };
            }
        } catch (error) {
            console.error('Update product error:', error);
            return { isOk: false, message: 'Network error. Please try again.' };
        }
    },

    async delete(id: string): Promise<{ isOk: boolean; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/Product/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                return { isOk: true };
            } else {
                const errorText = await response.text();
                return { isOk: false, message: errorText || 'Failed to delete product' };
            }
        } catch (error) {
            console.error('Delete product error:', error);
            return { isOk: false, message: 'Network error. Please try again.' };
        }
    },

    async search(id?: string, name?: string, category?: string): Promise<{ isOk: boolean; data?: Product[]; message?: string }> {
        try {
            const params = new URLSearchParams();
            if (id) params.append("id", id);
            if (name) params.append("name", name);
            if (category) params.append("category", category);

            const response = await fetch(`${API_BASE_URL}/Product/search?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const products: Product[] = await response.json();
                return { isOk: true, data: products };
            } else {
                const errorText = await response.text();
                return { isOk: false, message: errorText || 'Search failed' };
            }
        } catch (error) {
            console.error('Search product error:', error);
            return { isOk: false, message: 'Network error. Please try again.' };
        }
    },

    async updateInventory(request: {
        productId: string;
        quantityChanged: number;
    }): Promise<{ isOk: boolean; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/Product/update-inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });

            if (response.ok) {
                return { isOk: true, message: 'Inventory updated successfully' };
            } else {
                const errorText = await response.text();
                return { isOk: false, message: errorText || 'Inventory update failed' };
            }
        } catch (error) {
            console.error('Update inventory error:', error);
            return { isOk: false, message: 'Network error. Please try again.' };
        }
    },

    async getInventoryHistory(productId: string): Promise<{ isOk: boolean; data?: any[]; message?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/Product/${productId}/inventory-history`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const history = await response.json();
                return { isOk: true, data: history };
            } else {
                const errorText = await response.text();
                return { isOk: false, message: errorText || 'Failed to get inventory history' };
            }
        } catch (error) {
            console.error('Get inventory history error:', error);
            return { isOk: false, message: 'Network error. Please try again.' };
        }
    },
        async getInventoryReport(filter: {
        fromDate?: string;
        toDate?: string;
        departmentId?: string;
        actionType?: string;
        groupBy?: string;
        range?: string;
    }): Promise<{ isOk: boolean; data?: any[]; message?: string }> {
        try {
            const params = new URLSearchParams();
            if (filter.fromDate) params.append("fromDate", filter.fromDate);
            if (filter.toDate) params.append("toDate", filter.toDate);
            if (filter.departmentId) params.append("departmentId", filter.departmentId);
            if (filter.actionType) params.append("actionType", filter.actionType);
            if (filter.groupBy) params.append("groupBy", filter.groupBy);
            if (filter.range) params.append("range", filter.range);

            const response = await fetch(`${API_BASE_URL}/Product/inventory-report?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const report = await response.json();
                return { isOk: true, data: report };
            } else {
                const errorText = await response.text();
                return { isOk: false, message: errorText || 'Failed to get inventory report' };
            }
        } catch (error) {
            console.error('Get inventory report error:', error);
            return { isOk: false, message: 'Network error. Please try again.' };
        }
    },

};
