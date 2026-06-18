"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Axios from "@/config/axios.config";
import { toast } from "sonner";
import { format } from "date-fns";
import { Payment, PaymentType } from "@/types/paymentType";
import { Lease } from "@/types/leaseType";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }
  return format(date, "PPP");
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }
  return format(date, "PPP p");
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "success":
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Successful
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="h-3.5 w-3.5 mr-1" />
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3.5 w-3.5 mr-1" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentType = (payment: Payment): PaymentType => {
  return payment.utility ? "utility" : "installment";
};

const getPaymentDetails = (payment: Payment) => {
  if (payment.utility) {
    return {
      type: "Utility",
      amount: payment.utility.amount,
      dueDate: payment.utility.dueDate,
      status: payment.utility.status,
    };
  } else if (payment.installement) {
    return {
      type: "Installment",
      amount: payment.installement.amount,
      dueDate: payment.installement.dueDate,
      status: payment.installement.status,
    };
  }
  return { type: "Unknown", amount: "0", dueDate: "", status: "" };
};

export default function PaymentsDetailPage() {
  const { id } = useParams();
  const leaseId = parseInt(id as string);
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lease, setLease] = useState<Lease | null>(null);

  // Calculate statistics
  const totalAmount = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount || "0"),
    0
  );
  const successfulPayments = payments.filter(
    (p) => p.status === "success"
  ).length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const failedPayments = payments.filter((p) => p.status === "failed").length;
  const successAmount = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

  const fetchPayments = async () => {
    try {
      const response = await Axios.get(`/tenants/payments/lease/${leaseId}/`, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      const data = response.data.data || [];
      setPayments(data);

      // Extract lease info from the first payment
      if (data.length > 0 && data[0].lease) {
        setLease(data[0].lease);
      } else {
        // If no payments, fetch lease separately
        const leaseResponse = await Axios.get(`/tenants/requests/${leaseId}/`, {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        });
        setLease(leaseResponse.data.data || null);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching payments:", err);
      toast.error("Failed to fetch payment details");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.role === "admin") {
      fetchPayments();
    } else {
      router.push("/dashboard");
    }
  }, [session]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Payment Details</h1>
          <p className="text-muted-foreground">
            Lease ID: {leaseId}
            {lease && ` - ${lease.property.name}`}
          </p>
        </div>
      </div>

      {/* Lease Information Card */}
      {lease && (
        <Card>
          <CardHeader>
            <CardTitle>Lease Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Property</p>
                <p className="font-semibold">{lease.property.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tenant</p>
                <p className="font-semibold">{lease.tenant.name}</p>
                <p className="text-xs text-muted-foreground">{lease.tenant.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Landlord</p>
                <p className="font-semibold">{lease.property.landlord.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-semibold">£{lease.monthly_rent || lease.installmentAmount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <div className="text-xs text-muted-foreground">
              Total amount: £{totalAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulPayments}</div>
            <div className="text-xs text-muted-foreground">
              Amount: £{successAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <div className="text-xs text-muted-foreground">
              Awaiting payment
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedPayments}</div>
            <div className="text-xs text-muted-foreground">
              Transaction failed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            All utility and installment payments for this lease
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead>Stripe Intent ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const details = getPaymentDetails(payment);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {payment.id.substring(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{details.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        £{parseFloat(payment.amount || "0").toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(details.dueDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(payment.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(payment.updatedAt)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {payment.stripePaymentIntentId ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {payment.stripePaymentIntentId.substring(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {payments.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No payments found for this lease
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
