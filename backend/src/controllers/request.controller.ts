import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { RequestService } from "../services/request.service";

export class RequestController {
  /**
   * POST /api/requests
   * Submit an asset allocation request
   */
  public static createRequest = asyncHandler(async (req: Request, res: Response) => {
    let supportingDocUrl: string | undefined;

    if (req.file) {
      supportingDocUrl = (req.file as any).path?.startsWith("http")
        ? (req.file as any).path
        : `/uploads/documents/${req.file.filename}`;
    }

    const request = await RequestService.createRequest(
      req.user!.id,
      req.body,
      supportingDocUrl
    );

    res.status(201).json({
      success: true,
      message: "Allocation request submitted successfully and is pending review.",
      data: { request },
    });
  });

  /**
   * GET /api/requests/my
   * View all allocation requests submitted by the logged-in user
   */
  public static getMyRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await RequestService.getMyRequests(req.user!.id);

    res.status(200).json({
      success: true,
      data: { requests },
    });
  });

  /**
   * PATCH /api/requests/:id/cancel
   * Cancel an owned request while still PENDING
   */
  public static cancelRequest = asyncHandler(async (req: Request, res: Response) => {
    const request = await RequestService.cancelRequest(req.user!.id, req.params.id);

    res.status(200).json({
      success: true,
      message: "Allocation request cancelled successfully.",
      data: { request },
    });
  });

  /**
   * GET /api/requests/pending (Admin Only)
   * View central pending approval queue
   */
  public static getPendingRequests = asyncHandler(async (_req: Request, res: Response) => {
    const requests = await RequestService.getPendingRequests();

    res.status(200).json({
      success: true,
      data: { requests },
    });
  });

  /**
   * GET /api/requests/:id
   * Get single request details
   */
  public static getRequestById = asyncHandler(async (req: Request, res: Response) => {
    const request = await RequestService.getRequestById(
      req.user!.id,
      req.user!.role,
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: { request },
    });
  });

  /**
   * PATCH /api/requests/:id/approve (Admin Only)
   * Approve a request and atomically decrement inventory stock
   */
  public static approveRequest = asyncHandler(async (req: Request, res: Response) => {
    const request = await RequestService.approveRequest(
      req.user!.id,
      req.params.id,
      req.body.adminRemark
    );

    res.status(200).json({
      success: true,
      message: "Allocation request approved and inventory stock allocated.",
      data: { request },
    });
  });

  /**
   * PATCH /api/requests/:id/reject (Admin Only)
   * Reject a request with mandatory reason
   */
  public static rejectRequest = asyncHandler(async (req: Request, res: Response) => {
    const request = await RequestService.rejectRequest(
      req.user!.id,
      req.params.id,
      req.body.adminRemark
    );

    res.status(200).json({
      success: true,
      message: "Allocation request rejected.",
      data: { request },
    });
  });

  /**
   * GET /api/requests/owned
   * View assets currently held in custody by the logged-in user
   */
  public static getOwnedAssets = asyncHandler(async (req: Request, res: Response) => {
    const assets = await RequestService.getOwnedAssets(req.user!.id);

    res.status(200).json({
      success: true,
      data: { assets },
    });
  });

  /**
   * POST /api/requests/:id/handover
   * Initiate asset handover with condition photos
   */
  public static initiateHandover = asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    const photoUrls = files.map((f: any) =>
      f.path?.startsWith("http") ? f.path : `/uploads/handover-photos/${f.filename}`
    );

    const request = await RequestService.initiateHandover(
      req.user!.id,
      req.params.id,
      photoUrls,
      req.body.handoverNotes
    );

    res.status(200).json({
      success: true,
      message: "Handover initiated and submitted for admin inspection.",
      data: { request },
    });
  });

  /**
   * GET /api/requests/handovers (Admin Only)
   * Central inspection desk for all pending return requests
   */
  public static getPendingHandovers = asyncHandler(async (_req: Request, res: Response) => {
    const handovers = await RequestService.getPendingHandovers();

    res.status(200).json({
      success: true,
      data: { handovers },
    });
  });

  /**
   * PATCH /api/requests/:id/handover/approve (Admin Only)
   * Verify return, restore stock, mark RETURNED
   */
  public static approveHandover = asyncHandler(async (req: Request, res: Response) => {
    const request = await RequestService.approveHandover(req.user!.id, req.params.id);

    res.status(200).json({
      success: true,
      message: "Handover inspected and approved. Inventory stock has been restored.",
      data: { request },
    });
  });

  /**
   * PATCH /api/requests/:id/handover/reject (Admin Only)
   * Reject handover with mandatory reason and revert to borrower
   */
  public static rejectHandover = asyncHandler(async (req: Request, res: Response) => {
    const request = await RequestService.rejectHandover(
      req.user!.id,
      req.params.id,
      req.body.adminRemark
    );

    res.status(200).json({
      success: true,
      message: "Handover rejected and reverted back to borrower custody.",
      data: { request },
    });
  });
}


