import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const reTypePasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long");

export const registerSchema = z
  .object({
    role: z.enum(["tenant", "landlord", "agent"], {
      required_error: "Please select a role",
    }),
    firstName: z.string().min(1, { message: "First Name is required" }),
    lastName: z.string().min(1, { message: "Last Name is required" }),
    email: z
      .string()
      .min(1, "Email is required")
      .email({ message: "Invalid email address" }),
    password: passwordSchema,
    rePassword: reTypePasswordSchema,
    phone: z
      .string()
      .min(10, "Mobile number must be at least 10 digits")
      .max(15, "Mobile number must not exceed 15 digits")
      .regex(/^\+?[0-9]+$/, "Invalid mobile number format"),
  })
  .refine((data) => data.password === data.rePassword, {
    message: "Passwords do not match",
    path: ["rePassword"],
  });

export type registerSchemaType = z.infer<typeof registerSchema>;
