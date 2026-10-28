import { z } from "zod";

export const createRequestSchema = z.object({
  body: z.object({
    productId: z
      .string({ required_error: "Product ID is required" })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID format"),
    quantity: z.coerce
      .number({ required_error: "Quantity is required" })
      .int("Quantity must be an integer")
      .min(1, "Quantity requested must be at least 1"),
    purpose: z
      .string({ required_error: "Justification/purpose is required" })
      .trim()
      .min(5, "Purpose must be at least 5 characters")
      .max(500, "Purpose cannot exceed 500 characters"),
    supportingDocUrl: z.string().optional(),
  }),
});

export const approveRequestSchema = z.object({
  body: z.object({
    adminRemark: z.string().trim().max(500).optional(),
  }),
});

export const rejectRequestSchema = z.object({
  body: z.object({
    adminRemark: z
      .string({ required_error: "A reason is mandatory when rejecting a request" })
      .trim()
      .min(3, "Rejection reason must be at least 3 characters")
      .max(500, "Rejection reason cannot exceed 500 characters"),
  }),
});

export const initiateHandoverSchema = z.object({
  body: z.object({
    handoverNotes: z.string().trim().max(500).optional(),
  }),
});

export const rejectHandoverSchema = z.object({
  body: z.object({
    adminRemark: z
      .string({ required_error: "A rejection reason is mandatory when rejecting a handover" })
      .trim()
      .min(3, "Rejection reason must be at least 3 characters")
      .max(500, "Rejection reason cannot exceed 500 characters"),
  }),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>["body"];
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>["body"];
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>["body"];
export type InitiateHandoverInput = z.infer<typeof initiateHandoverSchema>["body"];
export type RejectHandoverInput = z.infer<typeof rejectHandoverSchema>["body"];


