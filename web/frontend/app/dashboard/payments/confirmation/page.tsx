"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  FileText,
  Home,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { set } from "date-fns";
import Axios from "@/config/axios.config";
import { useSession } from "next-auth/react";

// // Dummy payment data for demonstration
// const paymentData = {
//   pay_1234: {
//     id: "pay_1234",
//     amount: 1200.0,
//     description: "April 2025 Rent",
//     date: new Date().toISOString(),
//     property: "Apartment 301, Sunset Towers",
//     paymentMethod: "Visa ending in 4242",
//     receiptNumber: "RCP-2025-04001",
//   },
//   pay_5678: {
//     id: "pay_5678",
//     amount: 150.0,
//     description: "Utility payment",
//     date: new Date().toISOString(),
//     property: "Apartment 301, Sunset Towers",
//     paymentMethod: "Visa ending in 4242",
//     receiptNumber: "RCP-2025-04002",
//   },
// };

export default function PaymentConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const statusParam = searchParams.get("status");
  const id = searchParams.get("id");
  const paymentIntentId = searchParams.get("paymentIntentId");

  const { data: session } = useSession();




  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "pending" | "failed">(
    "pending"
  );
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    if (!paymentId) {
      toast.error("No payment ID provided");
      router.push(`/dashboard/payments/${id}`);
      return;
    }

   

  try{

        

      }catch(err){
        console.error("Verification error:", err);
        toast.error("Payment succeeded, but verification failed. Please contact support.");
      }


    // In a real implementation, this would be an API call to check payment status
    const checkPaymentStatus = async () => {
      try {
        // Simulate API call delay
        const response = await Axios.put(
          `/tenants/payments/${paymentId}/verify/`,
          {
            paymentIntentId: paymentIntentId, // Add paymentIntentId to data
          },
          {
            headers: {
              Authorization: `Bearer ${session?.access}`, // Use token from session
            },
          }
        );
        if (response.status === 200) {
        setPaymentDetails(response.data.data);
        toast.success("Your payment has been verified successfully.");
          setStatus("success");
        
        } else {
           // For other statuses, redirect to confirmation page to check status
          setStatus("failed");

          toast.error("Payment verification failed. Please contact support.");

        }


        setLoading(false);
      } catch (error) {
        console.error("Error checking payment status:", error);
        toast.error("Could not check payment status");
        setStatus("failed");
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [paymentId, statusParam, router]);

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "pending":
        return <Clock className="h-16 w-16 text-amber-500" />;
      case "failed":
        return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "success":
        return "Payment Successful";
      case "pending":
        return "Payment Processing";
      case "failed":
        return "Payment Failed";
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case "success":
        return "Your payment has been processed successfully.";
      case "pending":
        return "Your payment is being processed. This may take a few moments.";
      case "failed":
        return "There was an issue processing your payment. Please try again.";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 max-w-md text-center">
        <Clock className="mx-auto h-12 w-12 text-primary animate-pulse" />
        <h2 className="mt-4 text-xl font-semibold">
          Checking payment status...
        </h2>
        <p className="mt-2 text-muted-foreground">
          Please wait while we verify your payment.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push(`/dashboard/payments/${id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Payments
      </Button>

      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">{getStatusIcon()}</div>
          <CardTitle className="text-2xl">{getStatusTitle()}</CardTitle>
          <CardDescription>{getStatusDescription()}</CardDescription>
        </CardHeader>

        {status === "success" && (
          <>
            <Separator />

            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">Payment Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Transaction completed on{" "}
                    {paymentDetails.completedAt
                      ? new Date(paymentDetails.completedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-lg font-bold">
                      ${paymentDetails.amount?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Receipt Number
                    </p>
                    <p className="text-lg">{paymentDetails.receiptNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment Method
                    </p>
                    <p className="text-lg">{paymentDetails.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-lg">{paymentDetails.description}</p>
                  </div>
                </div>

                <div className="rounded-md bg-muted p-4 flex items-start gap-3">
                  <Home className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{paymentDetails.property}</p>
                    <p className="text-sm text-muted-foreground">
                      Payment has been applied to your account
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
              <Button
                className="w-full"
                onClick={() => router.push(`/dashboard/payments/${id}`)}
              >
                Return to Payment Center
              </Button>
            </CardFooter>
          </>
        )}

        {status === "failed" && (
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => router.back()}
            >
              Try Again
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push(`/dashboard/payments/${id}`)}
            >
              Return to Payment Center
            </Button>
          </CardFooter>
        )}

        {status === "pending" && (
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button className="w-full" onClick={() => window.location.reload()}>
              Check Status Again
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push(`/dashboard/payments/${id}`)}
            >
              Return to Payment Center
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
