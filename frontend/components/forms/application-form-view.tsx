"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useAgentAxios } from "@/hooks/useAgentAxios";

interface TenantSignature {
  id: number;
  full_name: string;
  sign: string;
  date: string;
}

interface ApplicationFormData {
  id: number;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  first_name?: string;
  last_name?: string;
  email?: string;
  property?: {
    id: number;
    title: string;
  };
  dob: string;
  home_address: string;
  postcode: string;
  current_phone?: string;
  mobile?: string;
  work_email?: string;
  personal_email: string;
  rent_payer: string;
  status: "Student" | "Employee";
  how_heard?: string;
  credit_check: string;
  start_date?: string;
  end_date?: string;
  amount_of_bond: string;
  is_completed: boolean;
  signature?: string;
  nic?: string;
  date?: string;
  student_details?: {
    university: string;
    course_name: string;
    length: string;
    current_year: string;
    nin: string;
    loan_recieved: string;
    start_date: string;
    end_date: string;
    student_id: string;
  };
  employee_details?: {
    employer: string;
    position: string;
    length_of_employment: string;
    salary: string;
    employer_address: string;
    employer_postcode: string;
    employer_phone: string;
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
    name: string;
    address: string;
    postcode: string;
    phone: string;
    rental_period: string;
    reason_for_leaving: string;
  };
  tenant_signatures?: TenantSignature[];
}

interface ApplicationFormViewProps {
  applicationId: string;
}

export default function ApplicationFormView({ applicationId }: ApplicationFormViewProps) {
  const [formData, setFormData] = useState<ApplicationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const axios = useAgentAxios();

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/forms/application/${applicationId}/`);
        const data = response.data;
        
        // Fetch related data
        const studentDetailsResponse = await axios.get(`/forms/${applicationId}/student/`).catch(() => null);
        const employeeDetailsResponse = await axios.get(`/forms/${applicationId}/employee/`).catch(() => null);
        const parentDetailsResponse = await axios.get(`/forms/${applicationId}/parent/`).catch(() => null);
        const landlordDetailsResponse = await axios.get(`/forms/${applicationId}/landlord/`).catch(() => null);
        
        // Fetch tenant signatures from agreement form
        let tenantSignatures: TenantSignature[] = [];
        try {
          const agreementResponse = await axios.get(`/forms/${applicationId}/agreement/`);
          if (agreementResponse.data && agreementResponse.data.tenant_signs) {
            tenantSignatures = agreementResponse.data.tenant_signs;
          }
        } catch (error) {
          console.log("No agreement form found or tenant signatures not available");
        }
        
        setFormData({
          ...data,
          student_details: studentDetailsResponse?.data || null,
          employee_details: employeeDetailsResponse?.data || null,
          parent_details: parentDetailsResponse?.data || null,
          previous_landlord: landlordDetailsResponse?.data || null,
          tenant_signatures: tenantSignatures,
        });
      } catch (error) {
        console.error("Error fetching application data:", error);
        setError("Failed to load application data");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplicationData();
    }
  }, [applicationId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading application details...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !formData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error || "No application data found"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Application Form
          <Badge variant={formData.is_completed ? "default" : "secondary"}>
            {formData.is_completed ? "Completed" : "In Progress"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {formData.user?.first_name || formData.first_name} {formData.user?.last_name || formData.last_name}
            </div>
            <div>
              <span className="font-medium">Date of Birth:</span> {formData.dob ? format(new Date(formData.dob), "PPP") : "N/A"}
            </div>
            <div>
              <span className="font-medium">Home Address:</span> {formData.home_address}
            </div>
            <div>
              <span className="font-medium">Postcode:</span> {formData.postcode}
            </div>
            {/* <div>
              <span className="font-medium">Phone:</span> {formData.current_phone || "N/A"}
            </div> */}
            <div>
              <span className="font-medium">Mobile:</span> {formData.mobile || "N/A"}
            </div>
            <div>
              <span className="font-medium">Personal Email:</span> {formData.personal_email}
            </div>
            {/* <div>
              <span className="font-medium">Work Email:</span> {formData.work_email || "N/A"}
            </div> */}
            <div>
              <span className="font-medium">Rent Payer:</span> {formData.rent_payer}
            </div>
            <div>
              <span className="font-medium">Status:</span> {formData.status}
            </div>
          </div>
        </div>

        <Separator />

        {/* Student/Employee Details */}
        {formData.status === "Student" && formData.student_details && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Student Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">University:</span> {formData.student_details.university}
              </div>
              <div>
                <span className="font-medium">Course:</span> {formData.student_details.course_name}
              </div>
              <div>
                <span className="font-medium">Student Id:</span> {formData.student_details.student_id}
              </div>
              <div>
                <span className="font-medium">Course Length:</span> {formData.student_details.length}
              </div>
              <div>
                <span className="font-medium">Current Year:</span> {formData.student_details.current_year || "N/A"}
              </div>
              <div>
                <span className="font-medium">Loan Amount:</span> {formData.student_details.loan_recieved || "N/A"}
              </div>
              <div>
                <span className="font-medium">National Insurance Number:</span> {formData.student_details.nin || "N/A"}
              </div>
              {/* <div>
                <span className="font-medium">University Address:</span> {formData.student_details.university_address}
              </div>
              <div>
                <span className="font-medium">University Postcode:</span> {formData.student_details.university_postcode}
              </div>
              <div>
                <span className="font-medium">University Phone:</span> {formData.student_details.university_phone}
              </div> */}
            </div>
          </div>
        )}

        {formData.status === "Employee" && formData.employee_details && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Employee Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Employer:</span> {formData.employee_details.employer}
              </div>
              <div>
                <span className="font-medium">Position:</span> {formData.employee_details.position}
              </div>
              <div>
                <span className="font-medium">Length of Employment:</span> {formData.employee_details.length_of_employment}
              </div>
              <div>
                <span className="font-medium">Salary:</span> {formData.employee_details.salary}
              </div>
              <div>
                <span className="font-medium">Employer Address:</span> {formData.employee_details.employer_address}
              </div>
              <div>
                <span className="font-medium">Employer Postcode:</span> {formData.employee_details.employer_postcode}
              </div>
              <div>
                <span className="font-medium">Employer Phone:</span> {formData.employee_details.employer_phone}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Parent Details */}
        {formData.parent_details && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Parent/Guardian Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {formData.parent_details.name}
              </div>
              <div>
                <span className="font-medium">Relationship:</span> {formData.parent_details.relationship}
              </div>
              <div>
                <span className="font-medium">Address:</span> {formData.parent_details.address}
              </div>
              <div>
                <span className="font-medium">Postcode:</span> {formData.parent_details.postcode}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {formData.parent_details.phone}
              </div>
              <div>
                <span className="font-medium">Work Name:</span> {formData.parent_details.work_name}
              </div>
              <div>
                <span className="font-medium">Work Address:</span> {formData.parent_details.work_address}
              </div>
              <div>
                <span className="font-medium">Work Phone:</span> {formData.parent_details.work_phone}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Previous Landlord */}
        {formData.previous_landlord && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Previous Landlord</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {formData.previous_landlord.name}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {formData.previous_landlord.phone}
              </div>
              <div>
                <span className="font-medium">Address:</span> {formData.previous_landlord.address}
              </div>
              <div>
                <span className="font-medium">Postcode:</span> {formData.previous_landlord.postcode}
              </div>
              <div>
                <span className="font-medium">Rental Period:</span> {formData.previous_landlord.rental_period}
              </div>
              <div>
                <span className="font-medium">Reason for Leaving:</span> {formData.previous_landlord.reason_for_leaving}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Final Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Final Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Start Date:</span> {formData.start_date ? format(new Date(formData.start_date), "PPP") : "N/A"}
            </div>
            <div>
              <span className="font-medium">End Date:</span> {formData.end_date ? format(new Date(formData.end_date), "PPP") : "N/A"}
            </div>
            <div>
              <span className="font-medium">Bond Amount:</span> £{formData.amount_of_bond}
            </div>
            <div>
              <span className="font-medium">How Heard:</span> {formData.how_heard || "N/A"}
            </div>
            
          </div>
        </div>

        {/* Uploaded ID (NIC) */}
        {formData.nic && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">Uploaded ID (NIC)</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <span className="font-medium">Applicant Name:</span>
                    <p className="text-sm">{formData.user?.first_name || formData.first_name} {formData.user?.last_name || formData.last_name}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">ID Image:</span>
                    <div className="mt-2 border rounded-lg bg-white p-2 ">
                      <img
                        src={formData.nic}
                        alt={`ID of ${formData.user?.first_name || formData.first_name} ${formData.user?.last_name || formData.last_name}`}
                        className="max-w-full h-auto max-h-24 object-contain"
                        style={{ filter: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Applicant Signature */}
        {formData.signature && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">Applicant Signature</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <span className="font-medium">Applicant Name:</span>
                    <p className="text-sm">{formData.user?.first_name || formData.first_name} {formData.user?.last_name || formData.last_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date Signed:</span>
                    <p className="text-sm">{formData.date ? format(new Date(formData.date), "PPP") : "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium">Signature:</span>
                    <div className="mt-2 border rounded-lg bg-white p-2 max-w-[200px]">
                      <img 
                        src={formData.signature} 
                        alt={`Signature of ${formData.user?.first_name || formData.first_name} ${formData.user?.last_name || formData.last_name}`}
                        className="max-w-full h-auto max-h-20 object-contain"
                        style={{ filter: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tenant Signatures */}
        {formData.tenant_signatures && formData.tenant_signatures.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">Tenant Signatures</h3>
              <div className="space-y-4">
                {formData.tenant_signatures.map((signature, index) => (
                  <div key={signature.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <span className="font-medium">Tenant Name:</span>
                        <p className="text-sm">{signature.full_name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Date Signed:</span>
                        <p className="text-sm">{format(new Date(signature.date), "PPP")}</p>
                      </div>
                      <div>
                        <span className="font-medium">Signature:</span>
                        <div className="mt-2 border rounded-lg bg-white p-2 max-w-[200px]">
                          <img 
                            src={signature.sign} 
                            alt={`Signature of ${signature.full_name}`}
                            className="max-w-full h-auto max-h-20 object-contain"
                            style={{ filter: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}