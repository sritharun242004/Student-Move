import { z } from "zod";

export const personalFormSchema = z.object({
  dob: z.date({
    required_error: "Date of birth is required",
  }),
  home_address: z.string().min(1, "Home address is required"),
  postcode: z.string().min(1, "Postcode is required"),
  current_phone: z.string().optional(),
  mobile: z.string().min(1, "Mobile number is required"),
  work_email: z.string().email().optional(),
  personal_email: z.string().email("Valid email is required"),
  rent_payer: z.string().min(1, "Rent payer information is required"),
  status: z.enum(["Student", "Employee"]),
});

export const studentFormSchema = z.object({
  university: z.string().min(1, "University name is required"),
  student_id: z.string().min(1, "Student ID is required"),
  course_name: z.string().min(1, "Course name is required"),
  length: z.string().min(1, "Course length is required"),
  current_year: z.string().min(1, "Current year is required").transform(Number),
  nin: z.string().min(1, "National Insurance Number is required"),
  loan_recieved: z.string().min(1, "Loan amount is required").transform(Number),
});

export const employeeFormSchema = z.object({
  employer: z.string().min(1, "Employer name is required"),
  address: z.string().min(1, "Address is required"),
  postcode: z.string().min(1, "Postcode is required"),
  phone: z.string().min(1, "Phone number is required"),
  years: z.string().min(0).transform(Number),
  months: z.string().min(0).transform(Number),
  job_title: z.string().min(1, "Job title is required"),
});

export const parentFormSchema = z.object({
  name: z.string().min(1, "Parent/Guardian name is required"),
  address: z.string().min(1, "Address is required"),
  postcode: z.string().min(1, "Postcode is required"),
  phone: z.string().min(1, "Phone number is required"),
  work_name: z.string().min(1, "Work name is required"),
  work_address: z.string().min(1, "Work address is required"),
  work_postcode: z.string().min(1, "Work postcode is required"),
  work_phone: z.string().min(1, "Work phone is required"),
  relationship: z.string().min(1, "Relationship is required"),
});

export const previousLandlordFormSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  property_address: z.string().optional(),
  postcode: z.string().optional(),
  property_postcode: z.string().optional(),
  number_of_beds: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : null)),
  current_rent: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : null)),
  per_week: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : null)),
  bond: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : null)),
});

export const finalFormSchema = z.object({
  how_heard: z.string().min(1, "Please tell us how you heard about us"),
  date: z.date({
    required_error: "Date is required",
  }),
  signature: z.string().min(1, "Signature is required"),
});
