import { apiClient } from "./client";
import type {
  ApiResponse,
  Product,
  ProductQueryParams,
  ProductsResponseData,
} from "../types";

export interface ProductHoldersData {
  product: {
    id: string;
    name: string;
    totalStock: number;
    availableStock: number;
    allocatedCount: number;
  };
  holders: Array<{
    requestId: string;
    user: { _id?: string; id?: string; name: string; email: string };
    quantity: number;
    status: string;
    approvedAt?: string;
    purpose: string;
  }>;
}

export const productService = {
  async getProducts(params?: ProductQueryParams): Promise<ProductsResponseData> {
    const queryParams: Record<string, string | number | boolean | undefined> = { ...params };
    if (typeof queryParams.inStock === "boolean") {
      queryParams.inStock = queryParams.inStock ? "true" : undefined;
    }

    const res = await apiClient.get<ApiResponse<ProductsResponseData>>("/products", {
      params: queryParams,
    });
    return res.data.data;
  },

  async getCategories(): Promise<string[]> {
    const res = await apiClient.get<ApiResponse<{ categories: string[] }>>("/products/categories");
    return res.data.data.categories;
  },

  async getProductById(id: string): Promise<Product> {
    const res = await apiClient.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
    return res.data.data.product;
  },

  async createProduct(formData: FormData): Promise<Product> {
    const res = await apiClient.post<ApiResponse<{ product: Product }>>("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data.product;
  },

  async updateProduct(id: string, data: FormData | Record<string, unknown>): Promise<Product> {
    const isFormData = data instanceof FormData;
    const res = await apiClient.put<ApiResponse<{ product: Product }>>(`/products/${id}`, data, {
      headers: isFormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : {
            "Content-Type": "application/json",
          },
    });
    return res.data.data.product;
  },

  async adjustStock(id: string, totalStock: number): Promise<Product> {
    const res = await apiClient.put<ApiResponse<{ product: Product }>>(`/products/${id}`, {
      totalStock,
    });
    return res.data.data.product;
  },

  async getProductHolders(id: string): Promise<ProductHoldersData> {
    const res = await apiClient.get<ApiResponse<ProductHoldersData>>(`/products/${id}/holders`);
    return res.data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
