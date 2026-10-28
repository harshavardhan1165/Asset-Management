import { Types } from "mongoose";
import { AssetRequest, IAssetRequest } from "../models/AssetRequest.model";
import { Product } from "../models/Product.model";
import { RequestStatus } from "../constants/requestState";
import { UserRole } from "../constants/roles";
import { AppError } from "../utils/AppError";
import { CreateRequestInput } from "../validations/request.schema";

export class RequestService {
  /**
   * Submits a new allocation request for an in-stock asset
   */
  public static async createRequest(
    userId: string,
    input: CreateRequestInput,
    supportingDocUrl?: string
  ): Promise<IAssetRequest> {
    const product = await Product.findById(input.productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // Business rule: Check zero-stock lockout
    if (product.availableStock === 0) {
      throw new AppError(
        `Cannot request '${product.name}': Item is currently out of stock.`,
        400
      );
    }

    // Business rule: Requested quantity cannot exceed available stock
    if (input.quantity > product.availableStock) {
      throw new AppError(
        `Requested quantity (${input.quantity}) exceeds currently available stock (${product.availableStock}).`,
        400
      );
    }

    const request = await AssetRequest.create({
      userId: new Types.ObjectId(userId),
      productId: product._id,
      quantity: input.quantity,
      purpose: input.purpose,
      supportingDocUrl: supportingDocUrl || input.supportingDocUrl || "",
      status: RequestStatus.PENDING,
    });

    return request;
  }

  /**
   * Retrieves all requests submitted by the logged-in user (chronological, newest first)
   */
  public static async getMyRequests(userId: string): Promise<IAssetRequest[]> {
    return AssetRequest.find({ userId })
      .populate("productId", "name category imageUrl availableStock totalStock")
      .sort({ createdAt: -1 });
  }

  /**
   * Cancels a pending request (Owner only, strictly while status is PENDING)
   */
  public static async cancelRequest(
    userId: string,
    requestId: string
  ): Promise<IAssetRequest> {
    const request = await AssetRequest.findById(requestId);
    if (!request) {
      throw new AppError("Allocation request not found", 404);
    }

    // Ownership verification
    if (request.userId.toString() !== userId) {
      throw new AppError("You can only cancel your own requests", 403);
    }

    // State machine guard: Only PENDING requests can be cancelled
    if (request.status !== RequestStatus.PENDING) {
      throw new AppError(
        `Cannot cancel request. Only PENDING requests can be cancelled, but this request is already '${request.status}'.`,
        400
      );
    }

    request.status = RequestStatus.CANCELLED;
    await request.save();
    return request;
  }

  /**
   * Retrieves a single request with populated user and product details
   */
  public static async getRequestById(
    userId: string,
    userRole: string,
    requestId: string
  ): Promise<IAssetRequest> {
    const request = await AssetRequest.findById(requestId)
      .populate("userId", "name email")
      .populate("productId", "name category imageUrl availableStock totalStock");

    if (!request) {
      throw new AppError("Allocation request not found", 404);
    }

    // Non-admins can only view their own requests
    const requesterId = (request.userId as any)._id?.toString() || request.userId.toString();
    if (userRole !== UserRole.ADMIN && requesterId !== userId) {
      throw new AppError("Access denied: You do not have permission to view this request", 403);
    }

    return request;
  }

  /**
   * Admin Approval Queue: Lists all PENDING requests organization-wide
   */
  public static async getPendingRequests(): Promise<IAssetRequest[]> {
    return AssetRequest.find({ status: RequestStatus.PENDING })
      .populate("userId", "name email")
      .populate("productId", "name category imageUrl availableStock totalStock")
      .sort({ createdAt: 1 }); // Oldest pending first for fair processing
  }

  /**
   * Approves a request with atomic stock decrement (Zero-Overdraft Guarantee)
   */
  public static async approveRequest(
    adminId: string,
    requestId: string,
    adminRemark?: string
  ): Promise<IAssetRequest> {
    const request = await AssetRequest.findById(requestId);
    if (!request) {
      throw new AppError("Allocation request not found", 404);
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new AppError(
        `Cannot approve request. Expected status PENDING, but current status is '${request.status}'.`,
        400
      );
    }

    // ATOMIC CONDITIONAL STOCK DECREMENT
    // Prevents double-allocation even under high concurrent admin approvals
    const product = await Product.findOneAndUpdate(
      {
        _id: request.productId,
        availableStock: { $gte: request.quantity }, // Precondition: available stock must cover quantity
      },
      {
        $inc: { availableStock: -request.quantity },
      },
      { new: true }
    );

    if (!product) {
      throw new AppError(
        "Insufficient stock available to approve this allocation request.",
        409
      );
    }

    // Update request state
    request.status = RequestStatus.APPROVED;
    request.approvedAt = new Date();
    request.processedBy = new Types.ObjectId(adminId);
    if (adminRemark) {
      request.adminRemark = adminRemark;
    }

    await request.save();
    return request;
  }

  /**
   * Rejects a request with a mandatory remark (Inventory stock remains untouched)
   */
  public static async rejectRequest(
    adminId: string,
    requestId: string,
    adminRemark: string
  ): Promise<IAssetRequest> {
    const request = await AssetRequest.findById(requestId);
    if (!request) {
      throw new AppError("Allocation request not found", 404);
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new AppError(
        `Cannot reject request. Expected status PENDING, but current status is '${request.status}'.`,
        400
      );
    }

    request.status = RequestStatus.REJECTED;
    request.rejectedAt = new Date();
    request.processedBy = new Types.ObjectId(adminId);
    request.adminRemark = adminRemark;

    await request.save();
    return request;
  }

  /**
   * Owned Assets (Active Custody): Lists items currently held by the user
   */
  public static async getOwnedAssets(userId: string): Promise<IAssetRequest[]> {
    return AssetRequest.find({
      userId,
      status: { $in: [RequestStatus.APPROVED, RequestStatus.RETURN_PENDING] },
    })
      .populate("productId", "name category imageUrl availableStock totalStock")
      .sort({ approvedAt: -1 });
  }

  /**
   * Photo-Verified Handover: User submits condition photos to initiate return
   */
  public static async initiateHandover(
    userId: string,
    requestId: string,
    photoUrls: string[],
    notes?: string
  ): Promise<IAssetRequest> {
    const request = await AssetRequest.findById(requestId);
    if (!request) {
      throw new AppError("Allocation request not found", 404);
    }

    // Ownership check
    if (request.userId.toString() !== userId) {
      throw new AppError("You can only initiate handover for your own assets", 403);
    }

    // Prevent duplicate submissions
    if (request.status === RequestStatus.RETURN_PENDING) {
      throw new AppError(
        "Handover has already been submitted and is currently under review by an administrator.",
        400
      );
    }

    if (request.status !== RequestStatus.APPROVED) {
      throw new AppError(
        `Cannot initiate handover. Asset must be currently in custody (APPROVED), but status is '${request.status}'.`,
        400
      );
    }

    if (!photoUrls || photoUrls.length === 0) {
      throw new AppError(
        "At least 1 photo verifying the condition of the asset is required.",
        400
      );
    }

    request.handoverPhotos = photoUrls;
    request.handoverNotes = notes || "";
    request.handoverRequestedAt = new Date();
    request.status = RequestStatus.RETURN_PENDING;

    await request.save();
    return request;
  }

  /**
   * Admin Handover Inspection Desk: Lists all handovers awaiting review
   */
  public static async getPendingHandovers(): Promise<IAssetRequest[]> {
    return AssetRequest.find({ status: RequestStatus.RETURN_PENDING })
      .populate("userId", "name email")
      .populate("productId", "name category imageUrl availableStock totalStock")
      .sort({ handoverRequestedAt: 1 });
  }

  /**
   * Admin approves return: Restores inventory stock and marks request RETURNED
   */
  public static async approveHandover(
    adminId: string,
    requestId: string
  ): Promise<IAssetRequest> {
    const request = await AssetRequest.findById(requestId);
    if (!request) {
      throw new AppError("Allocation request not found", 404);
    }

    if (request.status !== RequestStatus.RETURN_PENDING) {
      throw new AppError(
        `Cannot approve handover. Expected status RETURN_PENDING, but current status is '${request.status}'.`,
        400
      );
    }

    // Restock the product inventory atomically
    await Product.findByIdAndUpdate(request.productId, {
      $inc: { availableStock: request.quantity },
    });

    request.status = RequestStatus.RETURNED;
    request.returnedAt = new Date();
    request.processedBy = new Types.ObjectId(adminId);

    await request.save();
    return request;
  }

  /**
   * Admin rejects return: Reverts status to APPROVED so borrower can rectify discrepancy
   */
  public static async rejectHandover(
    adminId: string,
    requestId: string,
    reason: string
  ): Promise<IAssetRequest> {
    const request = await AssetRequest.findById(requestId);
    if (!request) {
      throw new AppError("Allocation request not found", 404);
    }

    if (request.status !== RequestStatus.RETURN_PENDING) {
      throw new AppError(
        `Cannot reject handover. Expected status RETURN_PENDING, but current status is '${request.status}'.`,
        400
      );
    }

    // Revert status to APPROVED with admin explanation
    request.status = RequestStatus.APPROVED;
    request.handoverRejectedReason = reason;
    request.adminRemark = reason;
    request.processedBy = new Types.ObjectId(adminId);

    await request.save();
    return request;
  }
}

