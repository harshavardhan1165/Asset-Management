export interface Product {
  _id?: string;
  id: string;
  name: string;
  category: string;
  description: string;
  totalStock: number;
  availableStock: number;
  imageUrl?: string;
  isInStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryParams {
  category?: string;
  inStock?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StockAdjustmentInput {
  totalStock?: number;
  availableStock?: number;
}

export interface ProductsResponseData {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
