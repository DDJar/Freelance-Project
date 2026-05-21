export interface Product {
  id: string;
  name: string;
  productCode: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  description: string;
  imageUrl?: string; 
  createdAt: string;
  updatedAt: string;
  idDepartment: string;
}
export type CreateProductDTO = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

