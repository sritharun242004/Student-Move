"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useAgentAxios } from "@/hooks/useAgentAxios";

interface GuarantorFormData {
  id: number;
  application: number;
  guarantor_name: string;
  occupation: string;
  home_address: string;
  work_address: string;
  time_at_address: string;
  previous_address?: string;
  home_phone: string;
  work_phone: string;
  mobile: string;
  personal_email: string;
  work_email?: string;
  bank_name: string;
  branch_address: string;
  fax?: string;
  g_relationship: string;
  ws_relationship: string;
  completed: boolean;
  credit_check: string;
  guarantor_sign?: string;
  gs_date?: string;
  witness_sign?: string;
  ws_date?: string;
}

interface GuarantorFormViewProps {
  applicationId: string;
}

export default function GuarantorFormView({ applicationId }: GuarantorFormViewProps) {
  const [formData, setFormData] = useState<GuarantorFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const axios = useAgentAxios();

  useEffect(() => {
    const fetchGuarantorData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/forms/${applicationId}/guarantor/`);
        setFormData(response.data);
      } catch (error) {
        console.error("Error fetching guarantor data:", error);
        setError("Failed to load guarantor data");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchGuarantorData();
    }
  }, [applicationId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guarantor Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading guarantor details...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !formData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guarantor Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {error || "No guarantor form submitted yet"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Guarantor Form
          <Badge variant={formData.completed ? "default" : "secondary"}>
            {formData.completed ? "Completed" : "In Progress"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {formData.guarantor_name}
            </div>
            <div>
              <span className="font-medium">Occupation:</span> {formData.occupation}
            </div>
            <div>
              <span className="font-medium">Home Address:</span> {formData.home_address}
            </div>
            <div>
              <span className="font-medium">Work Address:</span> {formData.work_address}
            </div>
            <div>
              <span className="font-medium">Time at Address:</span> {formData.time_at_address}
            </div>
            {formData.previous_address && (
              <div>
                <span className="font-medium">Previous Address:</span> {formData.previous_address}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Contact Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Home Phone:</span> {formData.home_phone}
            </div>
            <div>
              <span className="font-medium">Work Phone:</span> {formData.work_phone}
            </div>
            <div>
              <span className="font-medium">Mobile:</span> {formData.mobile}
            </div>
            <div>
              <span className="font-medium">Personal Email:</span> {formData.personal_email}
            </div>
            {formData.work_email && (
              <div>
                <span className="font-medium">Work Email:</span> {formData.work_email}
              </div>
            )}
            {formData.fax && (
              <div>
                <span className="font-medium">Fax:</span> {formData.fax}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Banking Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Banking Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Bank Name:</span> {formData.bank_name}
            </div>
            <div>
              <span className="font-medium">Branch Address:</span> {formData.branch_address}
            </div>
          </div>
        </div>
       

        {/* Signatures */}
        {(formData.guarantor_sign || formData.witness_sign) && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">Signatures</h3>
              <div className="space-y-4">
                {/* Guarantor Signature */}
                {formData.guarantor_sign && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Guarantor Signature</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <span className="font-medium">Guarantor Name:</span>
                        <p className="text-sm">{formData.guarantor_name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Date Signed:</span>
                        <p className="text-sm">{formData.gs_date ? format(new Date(formData.gs_date), "PPP") : "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Signature:</span>
                        <div className="mt-2 border rounded-lg bg-white p-2 max-w-[200px]">
                          <img 
                            src={formData.guarantor_sign} 
                            alt={`Signature of ${formData.guarantor_name}`}
                            className="max-w-full h-auto max-h-20 object-contain"
                            style={{ filter: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Witness Signature */}
                {formData.witness_sign && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-3">Witness Signature</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <span className="font-medium">Witness Relationship:</span>
                        <p className="text-sm">{formData.ws_relationship}</p>
                      </div>
                      <div>
                        <span className="font-medium">Date Signed:</span>
                        <p className="text-sm">{formData.ws_date ? format(new Date(formData.ws_date), "PPP") : "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Signature:</span>
                        <div className="mt-2 border rounded-lg bg-white p-2 max-w-[200px]">
                          <img 
                            src={formData.witness_sign} 
                            alt={`Witness signature`}
                            className="max-w-full h-auto max-h-20 object-contain"
                            style={{ filter: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}