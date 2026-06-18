"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Home, Phone, Mail, Calendar, FileText, CheckCircle, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import Axios from "@/config/axios.config";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { downloadFormAsPDF } from "@/lib/pdfUtils";

interface ApplicationFormData {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  full_name: string;
  property: {
    id: number;
    name: string;
    address: string;
  };
  dob: string;
  home_address: string;
  postcode: string;
  current_phone?: string;
  mobile?: string;
  work_email?: string;
  personal_email: string;
  rent_payer: string;
  status: string;
  how_heard?: string;
  credit_check: string;
  start_date?: string;
  end_date?: string;
  amount_of_bond: number;
  date?: string;
  is_completed: boolean;
  student_details?: {
    university: string;
    student_id: string;
    course_name: string;
    length: string;
    current_year: number;
    nin: string;
    loan_recieved: number;
  };
  employee_details?: {
    employer: string;
    address: string;
    postcode: string;
    phone: string;
    years: number;
    months: number;
    job_title: string;
  };
  parent_details?: {
    name: string;
    address: string;
    postcode: string;
    phone: string;
    work_name: string;
    work_address: string;
    work_postcode: string;
    work_phone: string;
    relationship: string;
  };
  previous_landlord?: {
    name?: string;
    address?: string;
    property_address?: string;
    postcode?: string;
    property_postcode?: string;
    number_of_beds?: number;
    current_rent?: number;
    per_week?: number;
    bond?: number;
  };
}

export default function ApplicationFormView() {
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
      <ApplicationFormViewContent />
    </Suspense>
  );
}

function ApplicationFormViewContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const leaseId = searchParams.get("leaseId");

  const [formData, setFormData] = useState<ApplicationFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leaseId || !session?.access) return;

    const fetchFormData = async () => {
      try {
        const response = await Axios.get(`/forms/lease/${leaseId}/application/`, {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        });
        setFormData(response.data.data);
      } catch (error: any) {
        console.error("Error fetching application form:", error);
        toast.error("Failed to load application form data");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [leaseId, session?.access]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadFormAsPDF('application-form-content', `application-form-${leaseId}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error('PDF download error:', error);
    }
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading application form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Application Form Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The application form for this lease could not be found.
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
    <div className="container mx-auto py-6 space-y-6" id="application-form-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Application Form</h1>
          <p className="text-muted-foreground">
            Tenant application details for lease #{leaseId}
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
            Personal Information
          </CardTitle>
          <CardDescription>
            Applicant's personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-lg font-medium">
                {formData.full_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
              <p className="text-lg">{formatDate(formData.dob)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Personal Email</label>
              <p className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {formData.personal_email}
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
              <label className="text-sm font-medium text-muted-foreground">Mobile</label>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {formData.mobile || "Not provided"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Current Phone</label>
              <p className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {formData.current_phone || "Not provided"}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground">Home Address</label>
            <p className="text-lg flex items-start gap-2">
              <Home className="h-4 w-4 text-muted-foreground mt-1" />
              <span>{formData.home_address}, {formData.postcode}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Property Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Information
          </CardTitle>
          <CardDescription>
            Details about the property being applied for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Property Name</label>
              <p className="text-lg font-medium">{formData.property.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Property Address</label>
              <p className="text-lg">{formData.property.address}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rent Payer</label>
              <p className="text-lg">{formData.rent_payer}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Application Status</label>
              <p className="text-lg">{formData.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Credit Check</label>
              <div className="mt-1">{getCreditCheckBadge(formData.credit_check)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">How Did You Hear About Us?</label>
              <p className="text-lg">{formData.how_heard || "Not specified"}</p>
            </div>
          </div>

          {formData.start_date && formData.end_date && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Lease Period</label>
                <p className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(formData.start_date)} - {formatDate(formData.end_date)}
                </p>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Bond Amount</label>
              <p className="text-lg font-medium">£{formData.amount_of_bond}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Application Date</label>
              <p className="text-lg">{formData.date ? formatDate(formData.date) : "Not specified"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Application Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={formData.is_completed ? "default" : "secondary"}>
              {formData.is_completed ? "Completed" : "Incomplete"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Application ID: #{formData.id}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Student Details */}
      {formData.student_details && (
        <Card>
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
            <CardDescription>
              Educational information for student applicants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">University</label>
                <p className="text-lg">{formData.student_details.university}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Student ID</label>
                <p className="text-lg">{formData.student_details.student_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Course Name</label>
                <p className="text-lg">{formData.student_details.course_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Course Length</label>
                <p className="text-lg">{formData.student_details.length}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Year</label>
                <p className="text-lg">{formData.student_details.current_year}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">National Insurance Number</label>
                <p className="text-lg">{formData.student_details.nin}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Student Loan Received</label>
                <p className="text-lg">£{formData.student_details.loan_recieved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Details */}
      {formData.employee_details && (
        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
            <CardDescription>
              Employment information for employed applicants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Employer</label>
                <p className="text-lg">{formData.employee_details.employer}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                <p className="text-lg">{formData.employee_details.job_title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Work Address</label>
                <p className="text-lg">{formData.employee_details.address}, {formData.employee_details.postcode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Work Phone</label>
                <p className="text-lg">{formData.employee_details.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Years at Company</label>
                <p className="text-lg">{formData.employee_details.years} years, {formData.employee_details.months} months</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parent Details */}
      {formData.parent_details && (
        <Card>
          <CardHeader>
            <CardTitle>Parent/Guardian Details</CardTitle>
            <CardDescription>
              Contact information for applicant's parent or guardian
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-lg">{formData.parent_details.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                <p className="text-lg">{formData.parent_details.relationship}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Home Address</label>
                <p className="text-lg">{formData.parent_details.address}, {formData.parent_details.postcode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Home Phone</label>
                <p className="text-lg">{formData.parent_details.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Work Name</label>
                <p className="text-lg">{formData.parent_details.work_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Work Address</label>
                <p className="text-lg">{formData.parent_details.work_address}, {formData.parent_details.work_postcode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Work Phone</label>
                <p className="text-lg">{formData.parent_details.work_phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Landlord */}
      {formData.previous_landlord && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Landlord Reference</CardTitle>
            <CardDescription>
              Information about applicant's previous accommodation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.previous_landlord.name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Landlord Name</label>
                  <p className="text-lg">{formData.previous_landlord.name}</p>
                </div>
              )}
              {formData.previous_landlord.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Landlord Address</label>
                  <p className="text-lg">{formData.previous_landlord.address}, {formData.previous_landlord.postcode}</p>
                </div>
              )}
              {formData.previous_landlord.property_address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Previous Property Address</label>
                  <p className="text-lg">{formData.previous_landlord.property_address}, {formData.previous_landlord.property_postcode}</p>
                </div>
              )}
              {formData.previous_landlord.number_of_beds && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Number of Bedrooms</label>
                  <p className="text-lg">{formData.previous_landlord.number_of_beds}</p>
                </div>
              )}
              {formData.previous_landlord.current_rent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Previous Monthly Rent</label>
                  <p className="text-lg">£{formData.previous_landlord.current_rent}</p>
                </div>
              )}
              {formData.previous_landlord.per_week && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Previous Weekly Rent</label>
                  <p className="text-lg">£{formData.previous_landlord.per_week}</p>
                </div>
              )}
              {formData.previous_landlord.bond && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Previous Bond Amount</label>
                  <p className="text-lg">£{formData.previous_landlord.bond}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}