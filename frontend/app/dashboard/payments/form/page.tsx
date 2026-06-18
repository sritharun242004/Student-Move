"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ArrowLeft, CreditCard, Shield, Landmark } from "lucide-react"; // Added Landmark

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import PaymentForm from "./payment-form";
import { useSession } from "next-auth/react";
import Axios from "@/config/axios.config";
import { Input } from "@/components/ui/input"; // Added Input
import { Label } from "@/components/ui/label"; // Added Label
import { Textarea } from "@/components/ui/textarea";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export default function PaymentFormPage() {
  const { data: session } = useSession();

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const installmentId = searchParams.get("installment_id");

  const clientSecret = searchParams.get("clientSecret");
  const payment_id = searchParams.get("payment_id");

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);

  // New state for payment method
  const [paymentMethod, setPaymentMethod] = useState<"card" | "direct_debit">(
    "card"
  );
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [directDebitData, setDirectDebitData] = useState<any>(null);

  interface Installment {
    amount: string;
    dueDate: string;
    type: string;
    lease: {
      property: {
        name: string;
      };
    };
  }

  const [installment, setInstallment] = useState<Installment>({
    amount: "0.00",
    dueDate: "",
    type: "",
    lease: {
      property: {
        name: "",
      },
    },
  });

  const fetchInstallmentData = async () => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      const response = await Axios.get(`/tenants/utilities/${installmentId}/`, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      setInstallment(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching installment:", err);
      toast.error("Failed to fetch installment details");
      router.push(`/dashboard/payments/${id}`);
    }
  };

  useEffect(() => {
    if (!installmentId) {
      toast.error("No payment selected");
      router.push(`/dashboard/payments/${id}`);
      return;
    }

    fetchInstallmentData();
  }, [installmentId, session]);

  // Fetch existing direct debit utility record if it exists
  useEffect(() => {
    const fetchDirectDebitData = async () => {
      try {
        if (!session?.access || !id) return;

        const response = await Axios.get(`/tenants/direct-debit-utility/${id}/`, {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        });

        // Check if there are any records
        if (response.data && response.data.length > 0) {
          // Get the first (or only) record since it's a OneToOne relationship
          setDirectDebitData(response.data[0]);
        }
      } catch (err) {
        // No existing record found, which is fine
        console.log("No existing direct debit record found");
      }
    };

    fetchDirectDebitData();
  }, [id, session?.access]);

  useEffect(() => {
    // This effect is now just for showing the loading spinner
    // The clientSecret is already passed as a prop
    if (!installmentId) {
      toast.error("No payment selected");
      router.push(`/dashboard/payments/${id}`);
      return;
    }

    // Simulate a brief loading period if data isn't fetched yet
    if (loading) {
      const timer = setTimeout(() => {
        if (loading) {
          // if still loading after 1.5s (e.g., fetchInstallmentData is slow)
          // we can stop the artificial loading state
          // but fetchInstallmentData already sets loading(false)
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [installmentId, router, loading]);

  // --- New Handlers for Direct Debit ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    } else {
      setProofFile(null);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleDirectDebitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proofFile && !notes) {
      toast.error("Please upload a proof file or add notes.");
      return;
    }

    setIsSubmitting(true);
    toast.info("Submitting direct debit documents...");

    try {
      const formData = new FormData();
      
      // Add proof_file if present
      if (proofFile) {
        formData.append("proof_file", proofFile);
      }
      
      // Add notes if present
      if (notes) {
        formData.append("notes", notes);
      }

      // Add lease_id for potential record creation
      formData.append("lease_id", id || "");

      // Use PATCH to update or create (if not found)
      const response = await Axios.patch(
        `/tenants/direct-debit-utility/${id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Direct debit documents submitted successfully!");

      // Reset form
      setProofFile(null);
      setNotes("");
      setIsSubmitting(false);
      
      // Navigate back to payments
      setTimeout(() => {
        router.push(`/dashboard/payments/${id}`);
      }, 1500);
    } catch (err) {
      console.error("Error submitting direct debit documents:", err);
      toast.error("Failed to submit direct debit documents. Please try again.");
      setIsSubmitting(false);
    }
  };

  // --- End of New Handlers ---

  if (loading) {
    return (
      <div className="container mx-auto py-12 max-w-md text-center">
        <CreditCard className="mx-auto h-12 w-12 text-primary animate-pulse" />
        <h2 className="mt-4 text-xl font-semibold">
          Loading payment details...
        </h2>
        <p className="mt-2 text-muted-foreground">
          Please wait while we retrieve your payment information.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push(`/dashboard/payments/${id}`)} // Fixed typo here
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Payments
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Complete Your Payment</CardTitle>
            <CardDescription>Choose your payment method below</CardDescription>
          </CardHeader>
          <CardContent>
            {/* --- Payment Method Toggle --- */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="flex-1"
              >
                <CreditCard className="mr-2 h-4 w-4" /> Credit Card
              </Button>
              <Button
                variant={
                  paymentMethod === "direct_debit" ? "default" : "outline"
                }
                onClick={() => setPaymentMethod("direct_debit")}
                className="flex-1"
              >
                <Landmark className="mr-2 h-4 w-4" /> Direct Debit
              </Button>
            </div>

            {/* --- Conditional Payment UI --- */}
            {paymentMethod === "card" && (
              <>
                {clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm paymentId={payment_id || ""} />
                  </Elements>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-red-500">
                      Unable to initialize card payment system. Please try
                      again.
                    </p>
                  </div>
                )}
              </>
            )}

            {paymentMethod === "direct_debit" && (
              // <div className="space-y-6">
              //   <div>
              //     <h3 className="font-semibold mb-2">Bank Transfer Details</h3>
              //     <p className="text-sm text-muted-foreground mb-4">
              //       Please transfer the total amount to the account below and
              //       upload a copy of your receipt for confirmation.
              //     </p>
              //     <Card className="bg-muted/50">
              //       <CardContent className="pt-6 space-y-2">
              //         <div className="flex justify-between text-sm">
              //           <span className="text-muted-foreground">
              //             Bank Name:
              //           </span>
              //           <span className="font-medium">Commercial Bank</span>
              //         </div>
              //         <div className="flex justify-between text-sm">
              //           <span className="text-muted-foreground">Branch:</span>
              //           <span className="font-medium">City Center Branch</span>
              //         </div>
              //         <div className="flex justify-between text-sm">
              //           <span className="text-muted-foreground">
              //             Account Name:
              //           </span>
              //           <span className="font-medium">
              //             Your Property Mgmt LLC
              //           </span>
              //         </div>
              //         <div className="flex justify-between text-sm">
              //           <span className="text-muted-foreground">
              //             Account Number:
              //           </span>
              //           <span className="font-medium">123-456-7890</span>
              //         </div>
              //         <div className="flex justify-between text-sm">
              //           <span className="text-muted-foreground">
              //             Reference:
              //           </span>
              //           <span className="font-medium text-primary">
              //             {installmentId}
              //           </span>
              //         </div>
              //       </CardContent>
              //     </Card>
              //   </div>

              //   <Separator />

              //   <form onSubmit={handleDirectDebitSubmit} className="space-y-4">
              //     <div className="space-y-2">
              //       <Label htmlFor="receipt">Upload Receipt / Slip</Label>
              //       <Input
              //         id="receipt"
              //         type="file"
              //         accept="image/png, image/jpeg, application/pdf"
              //         onChange={handleFileChange}
              //         className="file:text-primary file:font-medium"
              //       />
              //       <p className="text-xs text-muted-foreground">
              //         Supported formats: PNG, JPG, PDF.
              //       </p>
              //     </div>
              //     <Button
              //       type="submit"
              //       className="w-full"
              //       disabled={!receiptFile || isSubmitting}
              //     >
              //       {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
              //     </Button>
              //   </form>
              // </div>
              <div className="container max-w-3xl mx-auto py-8">
                <h1 className="text-2xl font-bold mb-8">
                  Direct Debit Documentation
                </h1>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">
                          Submit Direct Debit Documents
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Please provide any supporting documents and notes for
                          your Direct Debit setup.
                        </p>
                      </div>

                      {directDebitData && (
                        <Card className="mb-6 border-green-200 bg-green-50">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <h3 className="font-semibold mb-4 text-green-900">✓ Direct Debit Setup Status</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  <p className="font-medium capitalize">{directDebitData.status || "Pending"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Record ID</p>
                                  <p className="font-medium text-xs break-all">{directDebitData.id}</p>
                                </div>
                              </div>
                              {directDebitData.notes && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Notes</p>
                                  <p className="font-medium whitespace-pre-wrap">{directDebitData.notes}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <form onSubmit={handleDirectDebitSubmit} className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="proof_file">Proof Files</Label>
                            <Input
                              id="proof_file"
                              name="proof_file"
                              type="file"
                              onChange={handleFileChange}
                              className="cursor-pointer"
                              accept="image/*,.pdf"
                            />
                            <p className="text-xs text-muted-foreground">
                              Supported formats: PNG, JPG, PDF.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              name="notes"
                              value={notes}
                              onChange={handleNotesChange}
                              placeholder="Add any additional information here"
                              className="h-20"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isSubmitting || (!proofFile && !notes)}
                        >
                          {isSubmitting ? "Submitting..." : "Submit Documents"}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Payment Summary Card (Unchanged) --- */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>Review your payment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Amount Due</div>
              <div className="text-2xl font-bold">${installment.amount}</div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Type</span>
                <span className="font-medium">{installment.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Due Date</span>
                <span className="font-medium">
                  {new Date(installment.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Property</span>
                <span className="font-medium">
                  {installment.lease.property.name}
                </span>
              </div>
            </div>

            <Separator />

            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>Your payment is secure and encrypted</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
