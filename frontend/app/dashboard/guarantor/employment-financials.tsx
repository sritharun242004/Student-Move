// "use client";
// import React from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "./components/input";
// import { Label } from "@/components/ui/label";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { guarantorEmploymentSchema, type GuarantorEmployment } from "./schemas";
// import { GuarantorService } from "./service";

// interface EmploymentFinancialsProps {
//   handleNext: () => void;
//   handleBack: () => void;
//   formId: string;
//   onSave: (data: GuarantorEmployment) => void;
//   initialData?: Partial<GuarantorEmployment>;
// }

// export default function EmploymentFinancials({
//   handleNext,
//   handleBack,
//   formId,
//   onSave,
//   initialData,
// }: EmploymentFinancialsProps) {
//   const form = useForm<GuarantorEmployment>({
//     resolver: zodResolver(guarantorEmploymentSchema),
//     defaultValues: initialData || {},
//   });

//   const onSubmit = async (data: GuarantorEmployment) => {
//     try {
//       await GuarantorService.saveGuarantorDetails(formId, data);
//       onSave(data);
//       handleNext();
//     } catch (error) {
//       console.error("Error saving employment details:", error);
//     }
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Employment & Financials</CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="work_email">Work Email</Label>
//               <Input
//                 id="work_email"
//                 type="email"
//                 {...form.register("work_email")}
//                 error={form.formState.errors.work_email?.message}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="bank_name">Bank Name</Label>
//               <Input
//                 id="bank_name"
//                 {...form.register("bank_name")}
//                 error={form.formState.errors.bank_name?.message}
//               />
//             </div>
//           </div>
//           <div className="space-y-2">
//             <Label htmlFor="branch_address">Branch Address</Label>
//             <Input
//               id="branch_address"
//               {...form.register("branch_address")}
//               error={form.formState.errors.branch_address?.message}
//             />
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="fax">Fax</Label>
//               <Input
//                 id="fax"
//                 {...form.register("fax")}
//                 error={form.formState.errors.fax?.message}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="proof_of_employment">Proof of Employment</Label>
//               <Input
//                 id="proof_of_employment"
//                 type="file"
//                 {...form.register("proof_of_employment")}
//                 error={form.formState.errors.proof_of_employment?.message}
//               />
//             </div>
//           </div>
//           <div className="flex justify-between">
//             <Button type="button" onClick={handleBack} variant="outline">
//               Back
//             </Button>
//             <Button type="submit">Next</Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }
