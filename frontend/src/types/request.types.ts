import type { Product } from "./product.types";
import type { User } from "./user.types";

export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RETURN_PENDING"
  | "RETURNED";

export interface AssetRequest {
  _id?: string;
  id: string;
  userId: User | { _id?: string; id?: string; name: string; email: string };
  user?: User | { _id?: string; id?: string; name: string; email: string };
  productId: Product;
  product?: Product;
  quantity: number;
  purpose: string;
  supportingDocUrl?: string;
  status: RequestStatus;
  adminRemark?: string;
  handoverPhotos?: string[];
  handoverNotes?: string;
  handoverRequestedAt?: string;
  handoverRejectedReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestInput {
  productId: string;
  quantity: number;
  purpose: string;
  supportingDocUrl?: string;
}

export interface HandoverInput {
  handoverNotes?: string;
  photos: File[];
}

export interface RejectRequestInput {
  adminRemark: string;
}
