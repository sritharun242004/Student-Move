"use client";

import type React from "react";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentFormProps {
  paymentId: string;
}

export default function PaymentForm({ paymentId }: PaymentFormProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.log("Stripe.js has not loaded yet.");
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    setMessageType(null);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Return URL where customer will be redirected after payment
          return_url: `${window.location.origin}/dashboard/payments/confirmation?payment_id=${paymentId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        // Show error message
        setMessage(
          error.message || "An error occurred while processing your payment."
        );
        setMessageType("error");
        toast.error(
          error.message || "An error occurred while processing your payment."
        );
      } else if (paymentIntent && paymentIntent.status === "succeeded") {

        // we need to call backend , with paymentIntentId{

        setMessage("Payment successful! You will be redirected shortly.");
        setMessageType("success");
        toast.success("Your payment has been processed successfully.");
        setTimeout(() => {
          router.push(
            `/dashboard/payments/confirmation?payment_id=${paymentId}&status=success&id=${id}&paymentIntentId=${paymentIntent.id}`
          );
        }, 2000);
      } else {
        // For other statuses, redirect to confirmation page to check status
        router.push(
          `/dashboard/payments/confirmation?payment_id=${paymentId}&id=${id}`
        );
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage("An unexpected error occurred. Please try again.");
      setMessageType("error");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" />

      {message && (
        <div
          className={`p-4 rounded-md ${
            messageType === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          } flex items-start gap-3`}
        >
          {messageType === "success" ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p>{message}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        By clicking "Pay Now", you agree to our Terms of Service and Privacy
        Policy.
      </p>
    </form>
  );
}
