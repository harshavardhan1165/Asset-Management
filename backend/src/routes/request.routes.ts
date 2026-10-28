import { Router } from "express";
import { RequestController } from "../controllers/request.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { UserRole } from "../constants/roles";
import { uploadSupportingDoc, uploadHandoverPhotos } from "../config/upload";
import {
  createRequestSchema,
  approveRequestSchema,
  rejectRequestSchema,
  initiateHandoverSchema,
  rejectHandoverSchema,
} from "../validations/request.schema";

const router = Router();

// --- 1. User Requests Endpoints ---

// Submit allocation request (with optional sanction doc upload)
router.post(
  "/",
  authenticate,
  uploadSupportingDoc.single("document"),
  validate(createRequestSchema),
  RequestController.createRequest
);

// View user's own submitted requests (history)
router.get("/my", authenticate, RequestController.getMyRequests);

// View user's currently owned assets (active custody)
router.get("/owned", authenticate, RequestController.getOwnedAssets);

// --- 2. Admin Queues (Must be declared before /:id) ---

// Admin: Pending approval queue
router.get(
  "/pending",
  authenticate,
  authorize(UserRole.ADMIN),
  RequestController.getPendingRequests
);

// Admin: Handover inspection desk (pending returns)
router.get(
  "/handovers",
  authenticate,
  authorize(UserRole.ADMIN),
  RequestController.getPendingHandovers
);

// --- 3. Individual Request Actions ---

// Cancel pending request (Owner only)
router.patch("/:id/cancel", authenticate, RequestController.cancelRequest);

// Admin: Approve allocation request (Atomic stock decrement)
router.patch(
  "/:id/approve",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(approveRequestSchema),
  RequestController.approveRequest
);

// Admin: Reject allocation request (Mandatory remark)
router.patch(
  "/:id/reject",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(rejectRequestSchema),
  RequestController.rejectRequest
);

// --- 4. Handover & Return Verification ---

// User: Initiate handover with condition photos (1-2) and notes
router.post(
  "/:id/handover",
  authenticate,
  uploadHandoverPhotos.array("photos", 2),
  validate(initiateHandoverSchema),
  RequestController.initiateHandover
);

// Admin: Approve handover (Restore inventory stock & mark RETURNED)
router.patch(
  "/:id/handover/approve",
  authenticate,
  authorize(UserRole.ADMIN),
  RequestController.approveHandover
);

// Admin: Reject handover (Reverts to APPROVED with reason)
router.patch(
  "/:id/handover/reject",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(rejectHandoverSchema),
  RequestController.rejectHandover
);

// Get single request details
router.get("/:id", authenticate, RequestController.getRequestById);

export const requestRoutes = router;
