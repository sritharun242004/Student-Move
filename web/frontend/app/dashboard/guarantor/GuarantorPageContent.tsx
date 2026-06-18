"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import * as z from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GuarantorFormData,
  guarantorPersonalDetailsSchema,
  guarantorEmploymentSchema,
  guarantorSignaturesSchema,
} from "./schemas";
import GuarantorDetailsStep from "./steps/guarantor-details";
import FinalStep from "./steps/final-step";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import ShareGuarantorLink from "@/components/share-guarantor-link";
import ShareFeatureNotification from "@/components/share-feature-notification";

type FormData = GuarantorFormData;

export default function GuarantorPageContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const router = useRouter();
  const agentAxios = useAgentAxios();
  const [step, setStep] = useState(0);

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

  // Load initial form data
  useEffect(() => {
    if (!applicationId) return;
    const loadFormData = async () => {
      try {
        const response = await agentAxios.get(
          `/forms/${applicationId}/guarantor/`
        );
        if (response.data) {
          form.reset({
            guarantor_name: response.data.guarantor_name || "",
            occupation: response.data.occupation || "",
            home_address: response.data.home_address || "",
            work_address: response.data.work_address || "",
            time_at_address: response.data.time_at_address || "",
            previous_address: response.data.previous_address || "",
            home_phone: response.data.home_phone || "",
            work_phone: response.data.work_phone || "",
            mobile: response.data.mobile || "",
            personal_email: response.data.personal_email || "",
            work_email: response.data.work_email || "",
            bank_name: response.data.bank_name || "",
            branch_address: response.data.branch_address || "",
            fax: response.data.fax || "",
            proof_of_employment: response.data.proof_of_employment || undefined,
            guarantor_signature: response.data.guarantor_signature || "",
            witness_signature: response.data.witness_signature || "",
            g_relationship: response.data.g_relationship || "",
            ws_relationship: response.data.ws_relationship || "",
          });
        }
      } catch (error) {
        console.error("Failed to load guarantor form data:", error);
      }
    };
    loadFormData();
  }, [applicationId, form]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        // Prepare the payload with proper field names and exclude File objects
        const payload = {
          ...data,
          // Make sure signature fields are properly named
          guarantor_signature: data.guarantor_signature || '',
          witness_signature: data.witness_signature || '',
        };

        // Remove File objects as they can't be serialized in JSON
        if (payload.proof_of_employment instanceof File) {
          delete payload.proof_of_employment;
        }


        const result = await agentAxios.post(
          `/forms/${applicationId}/guarantor/add-details/`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        router.push("/dashboard/inquiries");
      } catch (error) {
        console.error("Error submitting form:", error);
        // Log the error response for debugging
        if (error && typeof error === 'object' && 'response' in error) {
          console.error("Error response:", (error as any).response?.data);
        }
      }
    },
    [applicationId, agentAxios, router]
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

  if (!applicationId) {
    return <div>No application ID provided</div>;
  }

  return (
    <FormProvider {...form}>
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Guarantor Form</h1>
            <ShareGuarantorLink
              applicationId={parseInt(applicationId)}
              className="ml-auto"
            />
          </div>
          <ShareFeatureNotification />
          <div className="bg-white rounded-lg shadow p-6">
            <StepComponent
              onNext={nextStep}
              onPrevious={prevStep}
              isFirstStep={step === 0}
              isLastStep={step === steps.length - 1}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      </div>
    </FormProvider>
  );
}