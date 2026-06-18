"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, User, Home, Phone, Mail, Building, CheckCircle, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import Axios from "@/config/axios.config";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { downloadFormAsPDF } from "@/lib/pdfUtils";

interface GuarantorFormData {
  id: number;
  guarantor_name: string;
  occupation: string;
  home_address: string;
  work_address: string;
  time_at_address: string;
  previous_address?: string;
  home_phone?: string;
  work_phone?: string;
  mobile: string;
  personal_email?: string;
  work_email?: string;
  bank_name: string;
  branch_address?: string;
  fax?: string;
  g_relationship?: string;
  gs_date?: string;
  ws_date?: string;
  ws_relationship?: string;
  credit_check: string;
  completed: boolean;
  guarantor_sign?: string;
  witness_sign?: string;
}

export default function GuarantorFormView() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <GuarantorFormViewContent />
    </Suspense>
  );
}

function GuarantorFormViewContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const leaseId = searchParams.get("leaseId");

  const [formData, setFormData] = useState<GuarantorFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leaseId || !session?.access) return;

    const fetchFormData = async () => {
      try {
        const response = await Axios.get(`/forms/lease/${leaseId}/guarantor/`, {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        });
        setFormData(response.data.data);
      } catch (error: any) {
        console.error("Error fetching guarantor form:", error);
        toast.error("Failed to load guarantor form data");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [leaseId, session?.access]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getCreditCheckBadge = (status: string) => {
    switch (status) {
      case "Pass":
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case "Fail":
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Not Checked</Badge>;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadFormAsPDF('guarantor-form-content', `guarantor-form-${leaseId}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error('PDF download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading guarantor form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Guarantor Form Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The guarantor form for this lease could not be found.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" id="guarantor-form-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guarantor Form</h1>
          <p className="text-muted-foreground">
            Guarantor details and signatures for lease #{leaseId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lease
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Guarantor Personal Information
          </CardTitle>
          <CardDescription>
            Details about the guarantor providing financial backing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-lg font-medium">{formData.guarantor_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Occupation</label>
              <p className="text-lg">{formData.occupation}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Mobile</label>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {formData.mobile}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Home Phone</label>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {formData.home_phone || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Work Phone</label>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {formData.work_phone || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Personal Email</label>
              <p className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {formData.personal_email || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Work Email</label>
              <p className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {formData.work_email || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Relationship to Tenant</label>
              <p className="text-lg">{formData.g_relationship || "Not specified"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Address Information
          </CardTitle>
          <CardDescription>
            Current and previous address details of the guarantor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Home Address</label>
            <p className="text-lg">{formData.home_address}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Work Address</label>
            <p className="text-lg">{formData.work_address}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Time at Current Address</label>
            <p className="text-lg">{formData.time_at_address}</p>
          </div>

          {formData.previous_address && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Previous Address</label>
              <p className="text-lg">{formData.previous_address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Banking Information
          </CardTitle>
          <CardDescription>
            Bank details for verification purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
              <p className="text-lg font-medium">{formData.bank_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Branch Address</label>
              <p className="text-lg">{formData.branch_address || "Not provided"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fax</label>
              <p className="text-lg">{formData.fax || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Signatures
          </CardTitle>
          <CardDescription>
            Digital signatures from the guarantor and witness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Guarantor Signature</label>
              {formData.guarantor_sign ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Signed</span>
                  </div>
                  <img
                    src={formData.guarantor_sign}
                    alt="Guarantor signature"
                    className="max-w-full h-auto border rounded"
                  />
                  {formData.gs_date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Signed on {formatDate(formData.gs_date)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                    <span className="text-sm text-muted-foreground">Not signed</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Witness Signature</label>
              {formData.witness_sign ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Signed</span>
                  </div>
                  <img
                    src={formData.witness_sign}
                    alt="Witness signature"
                    className="max-w-full h-auto border rounded"
                  />
                  {formData.ws_date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Signed on {formatDate(formData.ws_date)}
                    </p>
                  )}
                  {formData.ws_relationship && (
                    <p className="text-xs text-muted-foreground">
                      Relationship: {formData.ws_relationship}
                    </p>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                    <span className="text-sm text-muted-foreground">Not signed</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Form Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={formData.completed ? "default" : "secondary"}>
              {formData.completed ? "Completed" : "Incomplete"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Credit Check: {getCreditCheckBadge(formData.credit_check)}
            </span>
            <span className="text-sm text-muted-foreground">
              Form ID: #{formData.id}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}