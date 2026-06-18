import { z } from "zod";

// Agreement Details Schema
export const agreementDetailsSchema = z.object({
  agent: z.string().min(1, "Agent name is required"),
  agent_address: z.string().min(1, "Agent address is required"),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date({
    required_error: "End date is required",
  }),
  amount: z
    .string()
    .min(1, "Rent amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a valid positive number",
    }),
  payment_description: z.string().optional(),
});

// First Signatures Schema (Step 1)
export const agreementSignatures1Schema = z.object({
  land_lord_sign_1: z.string().optional(),
  lead_tenant_sign_1: z.string().optional(),
  admin_sign_1: z.string().optional(),
  admin_name_1: z.string().optional(),
});

// Second Signatures Schema (Step 2 - Final)
export const agreementSignatures2Schema = z.object({
  land_lord_sign: z.string().optional(),
  lead_tenant_sign: z.string().optional(),
  admin_sign: z.string().optional(),
  admin_name: z.string().optional(),
});

// Signatures Schema (Combined)
export const agreementSignaturesSchema = z.object({
  ...agreementSignatures1Schema.shape,
  ...agreementSignatures2Schema.shape,
});

// Complete Agreement Form Schema
export const agreementFormSchema = z.object({
  ...agreementDetailsSchema.shape,
  ...agreementSignaturesSchema.shape,
});

// Type definitions
export type AgreementDetails = z.infer<typeof agreementDetailsSchema>;
export type AgreementSignatures1 = z.infer<typeof agreementSignatures1Schema>;
export type AgreementSignatures2 = z.infer<typeof agreementSignatures2Schema>;
export type AgreementSignatures = z.infer<typeof agreementSignaturesSchema>;
export type AgreementFormData = z.infer<typeof agreementFormSchema>;

// Step props interface
export interface AgreementStepProps {
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  onSubmit?: (data: AgreementFormData) => void;
  isSharedAccess?: boolean;
}