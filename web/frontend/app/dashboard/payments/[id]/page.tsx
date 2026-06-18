"use client";

import { Badge } from "@/components/ui/badge";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, DollarSign, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Axios from "@/config/axios.config";
import { useSession } from "next-auth/react";

// Dummy data for upcoming payments
const upcomingPayments = [
  {
    id: "inst_1234",
    dueDate: "2025-04-01",
    amount: 1200.0,
    description: "April 2025 Rent",
    status: "pending",
  },
  {
    id: "inst_5678",
    dueDate: "2025-04-15",
    amount: 150.0,
    description: "Utility payment",
    status: "pending",
  },
];

export default function PaymentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = useParams();

  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  interface Payment {
    id: string;
    dueDate: string;
    amount: number;
    status: string;
    type: string;
    paidDate?: string;
    createdAt?: string;
    updatedAt?: string;
    lease: number;
  }

  const [upcomingPayments, setUpcomingPayments] = useState<Payment[]>([]);
  // Function to initiate payment process
  const initiatePayment = async (installmentId: string) => {
    try {
      // In a real implementation, this would be an API call to your backend
      // For now, we'll simulate it with a timeout
      toast.message("Initiating payment...", {
        description: "Connecting to payment service",
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Call the backend API to initiate the payment process
      const response = await Axios.post(
        `/tenants/payments/init/`,
        {
          utilityId: installmentId,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.access}`, // Use token from session
          },
        }
      );

      if (response.status === 200) {
        toast.success("Payment initiated successfully", {
          description: "Redirecting to payment form",
        });

        const payment_id = response.data.payment_id;
        const clientSecret = response.data.clientSecret;

        // Redirect to payment form page with the installment ID, payment ID, and clientSecret as params
        router.push(
          `/dashboard/payments/form?id=${id}&installment_id=${installmentId}&payment_id=${payment_id}&clientSecret=${clientSecret}`
        );
      } else {
        throw new Error("Failed to initiate payment");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error", {
        description: "Could not connect to payment service",
      });
    }
  };

  const fetchUtilities = async () => {
    try {
      //ge by lease id: update later
      const response = await Axios.get(`/tenants/utilities-list/${id}/`, {
        headers: {
          Authorization: `Bearer ${session?.access}`, // Use token from session
        },
      });
      // const installments = response.data.data;
      setUpcomingPayments(response.data.data);
    } catch (err) {
      console.error("Error fetching lease data:", err);
    }
  };

  useEffect(() => {
    fetchUtilities();
  }, [session]);

  return (
    <div className="container mx-auto py-6 ">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Center</h1>
          <p className="text-muted-foreground">
            Make payments for your rent and utilities
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Select a payment to process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingPayments.map((payment) => (
              <div
                key={payment.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedPayment === payment.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedPayment(payment.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  {/* <h3 className="font-medium">{payment.description}</h3> */}
                  <span className="font-bold">${payment.amount}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    Due: {new Date(payment.dueDate).toLocaleDateString()}
                  </span>
                  <span className="uppercase text-amber-600 font-medium">
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={!selectedPayment}
              onClick={() =>
                selectedPayment && initiatePayment(selectedPayment)
              }
            >
              Proceed to Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Make a Custom Payment</CardTitle>
            <CardDescription>Pay a custom amount</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Payment Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Additional Rent Payment"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="amount"
                    type="text"
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => {
                toast.message("Custom payment", {
                  description: "This feature is coming soon",
                });
              }}
            >
              Continue with Custom Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card> */}
      </div>

      {/* <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Your saved payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">
                      Expires 12/2026
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-50 text-green-700 hover:bg-green-50">
                  Default
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Mastercard ending in 5555</p>
                    <p className="text-sm text-muted-foreground">
                      Expires 10/2025
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Make Default
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Add New Payment Method
            </Button>
          </CardFooter>
        </Card>
      </div> */}
    </div>
  );
}
