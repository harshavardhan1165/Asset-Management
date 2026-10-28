import { z } from "zod";
import { UserRole } from "../constants/roles";

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name cannot exceed 60 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Please provide a valid email address")
      .toLowerCase(),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password cannot exceed 100 characters"),
    role: z
      .enum([UserRole.USER, UserRole.ADMIN])
      .optional()
      .default(UserRole.USER),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Please provide a valid email address")
      .toLowerCase(),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];

