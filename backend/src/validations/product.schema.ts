import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Product name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    category: z
      .string({ required_error: "Category is required" })
      .trim()
      .min(2, "Category must be at least 2 characters")
      .max(50, "Category cannot exceed 50 characters"),
    description: z
      .string({ required_error: "Description is required" })
      .trim()
      .min(5, "Description must be at least 5 characters")
      .max(1500, "Description cannot exceed 1500 characters"),
    totalStock: z.coerce
      .number({ required_error: "Total stock is required" })
      .int("Total stock must be an integer")
      .min(0, "Total stock cannot be negative"),
    imageUrl: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    category: z.string().trim().min(2).max(50).optional(),
    description: z.string().trim().min(5).max(1500).optional(),
    totalStock: z.coerce.number().int().min(0).optional(),
    imageUrl: z.string().optional(),
  }),
});

export const queryProductSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    inStock: z.enum(["true", "false"]).optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
export type QueryProductInput = z.infer<typeof queryProductSchema>["query"];

