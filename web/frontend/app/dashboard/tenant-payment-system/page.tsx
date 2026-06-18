"use client";

import type React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CalendarIcon,
  CreditCard,
  DollarSign,
  FileText,
  History,
  Home,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

// Initialize Stripe with your publishable key
// In a real app, you would use an environment variable
const stripePromise = loadStripe("pk_test_dummy_key");

// Dummy data for payment history
const paymentHistory = [
  {
    id: "pay_1234567890",
    date: "2025-03-01",
    amount: 1200.0,
    description: "March 2025 Rent",
    status: "completed",
    paymentMethod: "Visa ending in 4242",
    receiptUrl: "#",
  },
  {
    id: "pay_0987654321",
    date: "2025-02-01",
    amount: 1200.0,
    description: "February 2025 Rent",
    status: "completed",
    paymentMethod: "Visa ending in 4242",
    receiptUrl: "#",
  },
  {
    id: "pay_5678901234",
    date: "2025-01-01",
    amount: 1200.0,
    description: "January 2025 Rent",
    status: "completed",
    paymentMethod: "Bank transfer",
    receiptUrl: "#",
  },
  {
    id: "pay_3456789012",
    date: "2024-12-01",
    amount: 1200.0,
    description: "December 2024 Rent",
    status: "completed",
    paymentMethod: "Visa ending in 4242",
    receiptUrl: "#",
  },
  {
    id: "pay_2345678901",
    date: "2024-12-01",
    amount: 500.0,
    description: "Late fee payment",
    status: "completed",
    paymentMethod: "Mastercard ending in 5555",
    receiptUrl: "#",
  },
];

// Dummy data for upcoming payments
const upcomingPayments = [
  {
    id: "inv_1234567",
    dueDate: "2025-04-01",
    amount: 1200.0,
    description: "April 2025 Rent",
    status: "pending",
  },
  {
    id: "inv_7654321",
    dueDate: "2025-04-15",
    amount: 150.0,
    description: "Utility payment",
    status: "pending",
  },
];

// Dummy data for payment methods
const savedPaymentMethods = [
  {
    id: "pm_1234567890",
    type: "card",
    brand: "visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2026,
    isDefault: true,
  },
  {
    id: "pm_0987654321",
    type: "card",
    brand: "mastercard",
    last4: "5555",
    expMonth: 10,
    expYear: 2025,
    isDefault: false,
  },
];

// Component for making a payment
const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState("rent");
  const [amount, setAmount] = useState("1200.00");
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMethod, setPaymentMethod] = useState("new");
  const [description, setDescription] = useState("April 2025 Rent");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // In a real app, you would create a payment intent on the server
      // and confirm it here with the card element

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success(`$${amount} payment has been processed successfully.`);

      // Reset form
      setAmount("1200.00");
      setDescription("April 2025 Rent");
      elements.getElement(CardElement)?.clear();
    } catch (error) {
      toast.error(
        "Payment failed. There was an error processing your payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Type</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger id="paymentType">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">Rent Payment</SelectItem>
                <SelectItem value="deposit">Security Deposit</SelectItem>
                <SelectItem value="utility">Utility Payment</SelectItem>
                <SelectItem value="fee">Fee Payment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Payment Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {paymentDate ? format(paymentDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={paymentDate}
                onSelect={setPaymentDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Card</SelectItem>
              {savedPaymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)}{" "}
                  ending in {method.last4}
                </SelectItem>
              ))}
              <SelectItem value="bank">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod === "new" && (
          <div className="space-y-2">
            <Label htmlFor="card-element">Card Details</Label>
            <div className="rounded-md border border-input p-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                    invalid: {
                      color: "#9e2146",
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={!stripe || loading}>
          {loading ? "Processing..." : `Pay $${amount}`}
        </Button>
      </div>
    </form>
  );
};

// Component for payment history
const PaymentHistory = () => {
  const [filter, setFilter] = useState("all");

  const filteredPayments =
    filter === "all"
      ? paymentHistory
      : paymentHistory.filter((payment) =>
          payment.description.toLowerCase().includes(filter.toLowerCase())
        );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Payment History</h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="rent">Rent Only</SelectItem>
            <SelectItem value="utility">Utilities Only</SelectItem>
            <SelectItem value="fee">Fees Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
          <div>Date</div>
          <div>Description</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {filteredPayments.length > 0 ? (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="grid grid-cols-5 gap-4 p-4 border-b last:border-0"
            >
              <div>{format(new Date(payment.date), "MMM d, yyyy")}</div>
              <div>{payment.description}</div>
              <div>${payment.amount.toFixed(2)}</div>
              <div>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 hover:bg-green-50"
                >
                  {payment.status}
                </Badge>
              </div>
              <div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Receipt
                  </a>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No payment records found
          </div>
        )}
      </div>
    </div>
  );
};

// Component for upcoming payments
const UpcomingPayments = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Upcoming Payments</h3>

      <div className="rounded-md border">
        <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
          <div>Due Date</div>
          <div>Description</div>
          <div>Amount</div>
          <div>Actions</div>
        </div>

        {upcomingPayments.map((payment) => (
          <div
            key={payment.id}
            className="grid grid-cols-4 gap-4 p-4 border-b last:border-0"
          >
            <div>{format(new Date(payment.dueDate), "MMM d, yyyy")}</div>
            <div>{payment.description}</div>
            <div>${payment.amount.toFixed(2)}</div>
            <div>
              <Button
                size="sm"
                onClick={() => {
                  navigate("/dashboard/payments");
                }}
              >
                Pay Now
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main component
const TenantPaymentSystem = () => {
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Center</h1>
          <p className="text-muted-foreground">
            Make payments and view your payment history
          </p>
        </div>
      </div>

      <Tabs defaultValue="make-payment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="make-payment">
            <CreditCard className="mr-2 h-4 w-4" />
            Make Payment
          </TabsTrigger>
          <TabsTrigger value="payment-history">
            <History className="mr-2 h-4 w-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="upcoming-payments">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Upcoming Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="make-payment" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Make a Payment</CardTitle>
                <CardDescription>
                  Enter your payment details below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise}>
                  <PaymentForm />
                </Elements>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>
                  Your current balance and payment information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Current Balance
                  </div>
                  <div className="text-2xl font-bold">$1,350.00</div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Rent (Due Apr 1)</span>
                    <span>$1,200.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Utilities (Due Apr 15)</span>
                    <span>$150.00</span>
                  </div>
                </div>

                <Separator />

                <div className="rounded-md bg-muted p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4" />
                    <span>Apartment 301, Sunset Towers</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Lease period: Jan 1, 2025 - Dec 31, 2025
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment-history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View all your past payments and download receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming-payments">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payments</CardTitle>
              <CardDescription>
                View and pay your upcoming bills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpcomingPayments />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantPaymentSystem;
