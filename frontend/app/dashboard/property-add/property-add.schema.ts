import * as z from "zod";

export const propertyFormSchema = z.object({
  name: z.string().min(1, "Property name is required"), //
  address: z.string().min(1, "Address is required"), //
  city: z.number(), //
  area: z.number(), //
  zipCode: z //
    .string()
    .min(1, "Postal code is required"),
  // .regex(
  //   /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/,
  //   "Invalid UK postal code"
  // ),
  description: z.string().min(1, "Description must be at least 10 characters"), //
  price: z.string().min(1, "Price is required"), //
  rooms: z
    .number({ message: "No of bedrooms are required" })
    .min(1, "At least 1 bedroom required"), //
  bathrooms: z
    .number({ message: "No of bathrooms are required" })
    .min(1, "At least 1 bathroom required"), //
  epcRating: z.enum(["A", "B", "C", "D", "E", "F", "G"], {
    message: "EPC rating must be between A and G",
  }), //
  additionalDetails: z.object({
    //
    parking: z.string().optional(),
    accessibility: z.string().optional(),
    pets_allowed: z.string(),
    furnished: z.boolean(),
  }),
  status: z.string().optional(), //
  availableAfter: z.string().nullable().optional(), //
  availableTo: z.string().nullable().optional(), // Property available until date
  gasFromDate: z.string().nullable().optional(), // Gas safety certificate start date
  gasToDate: z.string().nullable().optional(), // Gas safety certificate end date
  electricFromDate: z.string().nullable().optional(), // Electric safety certificate start date
  electricToDate: z.string().nullable().optional(), // Electric safety certificate end date

  securityDeposit: z.number().optional(), //
  holdingDeposit: z.number().optional(), //
  billsIncluded: z.boolean().default(true), // Always true, read-only
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;

export interface University {
  id: number;
  name: string;
}
