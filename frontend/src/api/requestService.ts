import { apiClient } from "./client";
import type {
  ApiResponse,
  AssetRequest,
  CreateRequestInput,
  HandoverInput,
  RejectRequestInput,
} from "../types";

export const requestService = {
  // User Actions
  async submitRequest(input: CreateRequestInput): Promise<AssetRequest> {
    const res = await apiClient.post<ApiResponse<{ request: AssetRequest }>>("/requests", input);
    return res.data.data.request;
  },

  async getMyRequests(): Promise<AssetRequest[]> {
    const res = await apiClient.get<ApiResponse<{ requests: AssetRequest[] }>>("/requests/my");
    return res.data.data.requests;
  },

  async getOwnedAssets(): Promise<AssetRequest[]> {
    const res = await apiClient.get<ApiResponse<{ assets: AssetRequest[] }>>("/requests/owned");
    return res.data.data.assets;
  },

  async cancelRequest(id: string): Promise<AssetRequest> {
    const res = await apiClient.patch<ApiResponse<{ request: AssetRequest }>>(
      `/requests/${id}/cancel`
    );
    return res.data.data.request;
  },

  async submitHandover(id: string, input: HandoverInput): Promise<AssetRequest> {
    const formData = new FormData();
    input.photos.forEach((file) => {
      formData.append("photos", file);
    });
    if (input.handoverNotes) {
      formData.append("handoverNotes", input.handoverNotes);
    }

    const res = await apiClient.post<ApiResponse<{ request: AssetRequest }>>(
      `/requests/${id}/handover`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data.data.request;
  },

  // Admin Approval Queue
  async getPendingRequests(): Promise<AssetRequest[]> {
    const res = await apiClient.get<ApiResponse<{ requests: AssetRequest[] }>>("/requests/pending");
    return res.data.data.requests;
  },

  async approveRequest(id: string, adminRemark?: string): Promise<AssetRequest> {
    const res = await apiClient.patch<ApiResponse<{ request: AssetRequest }>>(
      `/requests/${id}/approve`,
      { adminRemark }
    );
    return res.data.data.request;
  },

  async rejectRequest(id: string, input: RejectRequestInput): Promise<AssetRequest> {
    const res = await apiClient.patch<ApiResponse<{ request: AssetRequest }>>(
      `/requests/${id}/reject`,
      input
    );
    return res.data.data.request;
  },

  // Admin Inspection Desk
  async getPendingHandovers(): Promise<AssetRequest[]> {
    const res = await apiClient.get<ApiResponse<{ handovers: AssetRequest[] }>>("/requests/handovers");
    return res.data.data.handovers;
  },

  async approveHandover(id: string): Promise<AssetRequest> {
    const res = await apiClient.patch<ApiResponse<{ request: AssetRequest }>>(
      `/requests/${id}/handover/approve`
    );
    return res.data.data.request;
  },

  async rejectHandover(id: string, input: RejectRequestInput): Promise<AssetRequest> {
    const res = await apiClient.patch<ApiResponse<{ request: AssetRequest }>>(
      `/requests/${id}/handover/reject`,
      input
    );
    return res.data.data.request;
  },
};
