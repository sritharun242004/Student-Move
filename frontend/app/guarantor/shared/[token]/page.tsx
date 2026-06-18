"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import * as z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import ClientOnly from "@/components/client-only";
import {
  GuarantorFormData,
  guarantorPersonalDetailsSchema,
  guarantorEmploymentSchema,
  guarantorSignaturesSchema,
} from "@/app/dashboard/guarantor/schemas";
import GuarantorDetailsStep from "@/app/dashboard/guarantor/steps/guarantor-details";
import FinalStep from "@/app/dashboard/guarantor/steps/final-step";

type FormData = GuarantorFormData;

interface ApplicationInfo {
  id: number;
  property_id: number;
  tenant_name: string;
  start_date: string;
  end_date: string;
}

export default function SharedGuarantorPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationInfo, setApplicationInfo] = useState<ApplicationInfo | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const validationSchema = z.object({
    ...guarantorPersonalDetailsSchema.shape,
    ...guarantorEmploymentSchema.shape,
    ...guarantorSignaturesSchema.shape,
  });

  const form = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      guarantor_name: "",
      occupation: "",
      home_address: "",
      work_address: "",
      time_at_address: "",
      previous_address: "",
      home_phone: "",
      work_phone: "",
      mobile: "",
      personal_email: "",
      work_email: "",
      bank_name: "",
      branch_address: "",
      fax: "",
      proof_of_employment: undefined,
      guarantor_signature: "",
      witness_signature: "",
      g_relationship: "",
      ws_relationship: "",
    },
  });

  // Create axios instance with token
  const sharedAxios = axios.create({
    baseURL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api",
    headers: {
      "X-Guarantor-Token": token,
    },
  });

  // Load initial form data
  useEffect(() => {
    const loadFormData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await sharedAxios.get("/forms/shared/guarantor/");
        
        if (response.data.status === "success") {
          const data = response.data.data;
          
          // Set application info
          if (data.application_info) {
            setApplicationInfo(data.application_info);
          }
          
          // If form data exists, populate the form
          if (data.guarantor_name) {
            form.reset({
              guarantor_name: data.guarantor_name || "",
              occupation: data.occupation || "",
              home_address: data.home_address || "",
              work_address: data.work_address || "",
              time_at_address: data.time_at_address || "",
              previous_address: data.previous_address || "",
              home_phone: data.home_phone || "",
              work_phone: data.work_phone || "",
              mobile: data.mobile || "",
              personal_email: data.personal_email || "",
              work_email: data.work_email || "",
              bank_name: data.bank_name || "",
              branch_address: data.branch_address || "",
              fax: data.fax || "",
              proof_of_employment: data.proof_of_employment || undefined,
              guarantor_signature: data.guarantor_signature || "",
              witness_signature: data.witness_signature || "",
              g_relationship: data.g_relationship || "",
              ws_relationship: data.ws_relationship || "",
            });
          }
        }
      } catch (error: any) {
        console.error("Failed to load guarantor form data:", error);
        if (error.response?.status === 401) {
          setError("Invalid or expired link. Please contact the tenant for a new link.");
        } else {
          setError("Failed to load form data. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      loadFormData();
    }
  }, [token, form]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        setIsLoading(true);
        
        // Prepare the payload
        const payload = {
          ...data,
          guarantor_signature: data.guarantor_signature || '',
          witness_signature: data.witness_signature || '',
        };
        
        // Remove File objects as they can't be serialized in JSON
        if (payload.proof_of_employment instanceof File) {
          delete payload.proof_of_employment;
        }
        
        
        const result = await sharedAxios.post(
          "/forms/shared/guarantor/",
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        
        if (result.data.status === "success") {
          setIsSubmitted(true);
        }
      } catch (error: any) {
        console.error("Error submitting form:", error);
        if (error.response?.status === 401) {
          setError("Your session has expired. Please use the link provided by the tenant again.");
        } else {
          setError("Failed to submit form. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [sharedAxios]
  );

  const steps = [
    {
      id: "guarantor-details",
      title: "Guarantor Details",
      component: GuarantorDetailsStep,
    },
    {
      id: "final-step",
      title: "Final Step",
      component: FinalStep,
    },
  ];

  const currentStep = steps[step];
  const StepComponent = currentStep.component;

  const nextStep = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              </div>
              <p className="text-center mt-4">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              </div>
              <p className="text-center mt-4">Loading form...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <CardTitle>Form Submitted Successfully</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Thank you for completing the guarantor form!</p>
                <p>Your information has been submitted successfully and the tenant will be notified.</p>
                {applicationInfo && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Application Details:</h4>
                    <p><strong>Tenant:</strong> {applicationInfo.tenant_name}</p>
                    <p><strong>Lease Period:</strong> {applicationInfo.start_date || 'TBD'} to {applicationInfo.end_date || 'TBD'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Guarantor Form</CardTitle>
              <CardDescription>
                You have been invited to complete a guarantor form
                <ClientOnly>
                  {applicationInfo && (
                    <span> for <strong>{applicationInfo.tenant_name}</strong></span>
                  )}
                </ClientOnly>
              </CardDescription>
            </CardHeader>
            <ClientOnly fallback={<div className="p-4">Loading application details...</div>}>
              {applicationInfo && (
                <CardContent>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Application Information:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p><strong>Tenant:</strong> {applicationInfo.tenant_name}</p>
                        <p><strong>Property ID:</strong> {applicationInfo.property_id}</p>
                        <p><strong>Start Date:</strong> {applicationInfo.start_date || 'TBD'}</p>
                        <p><strong>End Date:</strong> {applicationInfo.end_date || 'TBD'}</p>
                      </div>
                    </div>
                </CardContent>
              )}
            </ClientOnly>
          </Card>

          <Card>
            <CardContent className="p-6">
              <StepComponent
                onNext={nextStep}
                onPrevious={prevStep}
                isFirstStep={step === 0}
                isLastStep={step === steps.length - 1}
                onSubmit={onSubmit}
                isSharedAccess={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </FormProvider>
  );
}