import { z } from "zod";

export const guarantorPersonalDetailsSchema = z.object({
  guarantor_name: z.string().min(1, "Full name is required"),
  occupation: z.string().min(1, "Occupation is required"),
  home_address: z.string().min(1, "Home address is required"),
  work_address: z.string().min(1, "Work address is required"),
  time_at_address: z.string().min(1, "Time at address is required"),
  previous_address: z.string().optional(),
  home_phone: z.string().min(1, "Home phone is required"),
  work_phone: z.string().min(1, "Work phone is required"),
  mobile: z.string().min(1, "Mobile number is required"),
  personal_email: z.string().email("Invalid email address"),
});

export const guarantorEmploymentSchema = z.object({
  work_email: z.string().email("Invalid work email"),
  bank_name: z.string().min(1, "Bank name is required"),
  branch_address: z.string().min(1, "Branch address is required"),
  fax: z.string().optional(),
  proof_of_employment: z.any().optional(), // Changed from File to any to allow omission
});

export const guarantorSignaturesSchema = z.object({
  guarantor_signature: z.string().optional(),
  witness_signature: z.string().optional(),
  // Make relationships optional so parent/guarantor can submit without them
  g_relationship: z.string().optional(),
  ws_relationship: z.string().optional(),
});

export type GuarantorPersonalDetails = z.infer<
  typeof guarantorPersonalDetailsSchema
>;
export type GuarantorEmployment = z.infer<typeof guarantorEmploymentSchema>;
export type GuarantorSignatures = z.infer<typeof guarantorSignaturesSchema>;

export type GuarantorFormData = GuarantorPersonalDetails &
  GuarantorEmployment &
  GuarantorSignatures;
