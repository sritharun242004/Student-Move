"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Circle } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  AgreementFormData,
  agreementFormSchema,
} from "./schemas";
import AgreementDetailsStep from "./steps/agreement-details";
import AgreementSignatures1Step from "./steps/agreement-signatures-1";
import AgreementSignaturesStep from "./steps/agreement-signatures";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { AgreementService } from "./service";

type FormData = AgreementFormData;

interface Step {
  id: string;
  title: string;
  component: React.ComponentType<any>;
}

export default function AgreementPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const applicationId = searchParams.get("applicationId");
  const propertyId = searchParams.get("propertyId");
  const agentAxios = useAgentAxios();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState("");

  const form = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(agreementFormSchema),
    defaultValues: {
      agent: "",
      agent_address: "",
      start_date: undefined,
      end_date: undefined,
      amount: "",
      payment_description: "",
      land_lord_sign_1: "",
      admin_sign_1: "",
      land_lord_sign: "",
      admin_sign: "",
    },
  });

  // Load initial form data
  useEffect(() => {
    if (!applicationId) return;

    const loadFormData = async () => {
      try {
        setIsLoading(true);

        // First check status to see if user can access
        const statusResponse = await agentAxios.get(`/forms/${applicationId}/agreement/status`);
        const status = statusResponse.data.data;

        // Check access permissions based on user role
        const isTenant = session?.role === "tenant";
        const isAdmin = session?.role === "admin";

        if (status.status === "locked") {
          setAccessDenied(true);
          if (isTenant) {
            setAccessDeniedMessage("Please wait for the agent/landlord to create the agreement form first.");
          } else if (isAdmin) {
            setAccessDeniedMessage("Application and guarantor forms must be completed first.");
          } else {
            setAccessDeniedMessage("Application and guarantor forms must be completed first.");
          }
          return;
        }

        // Additional check for tenants - they can only access if agent has filled the form
        if (isTenant && !status.exists) {
          setAccessDenied(true);
          setAccessDeniedMessage("The agent/landlord must create the agreement form first.");
          return;
        }

        if (isTenant && status.exists && !status.agent_filled) {
          setAccessDenied(true);
          setAccessDeniedMessage("Please wait for the agent/landlord to complete the agreement details first.");
          return;
        }

        // Additional check for admin - they can only access if tenant and agent have signed
        if (isAdmin && status.exists && status.status !== "can_sign" && status.status !== "pending_admin_signature") {
          setAccessDenied(true);
          setAccessDeniedMessage("Please wait for the tenant and agent to sign the agreement first.");
          return;
        }

        if (status.exists) {
          const response = await agentAxios.get(`/forms/${applicationId}/agreement/`);

          if (response.data) {
            form.reset({
              agent: response.data.agent || "",
              agent_address: response.data.agent_address || "",
              start_date: response.data.start_date ? new Date(response.data.start_date) : undefined,
              end_date: response.data.end_date ? new Date(response.data.end_date) : undefined,
              amount: response.data.amount ? response.data.amount.toString() : "",
              payment_description: response.data.payment_description || "",
              land_lord_sign: response.data.land_lord_sign || "",
              admin_sign: response.data.admin_sign || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to load agreement form data:", error);
        // This might be expected if no agreement exists yet or user doesn't have access
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [applicationId, form, router, session]);

  const steps: Step[] = [
    {
      id: "agreement-details",
      title: "Agreement Details",
      component: AgreementDetailsStep,
    },
    {
      id: "signatures-1",
      title: "Rental Agreement",
      component: AgreementSignatures1Step,
    },
    {
      id: "signatures",
      title: "Utility Agreement",
      component: AgreementSignaturesStep,
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

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        // Navigate back to lease steps to show completion
        const destination = session?.role === "admin" ? "/dashboard" : "/dashboard/inquiries";
        router.push(destination);
      } catch (error) {
        console.error("Error after agreement completion:", error);
      }
    },
    [router, propertyId, session]
  );

  if (!applicationId) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Error</h1>
            <p>No application ID provided</p>
          </div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{accessDeniedMessage}</p>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
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
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading Agreement Form...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Agreement Form</h1>
              <p className="text-muted-foreground">
                Complete the lease agreement details and signatures
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {steps.map((stepItem, index) => (
                  <div key={stepItem.id} className="flex items-center">
                    <div className="flex items-center gap-2">
                      {index < step ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : index === step ? (
                        <Circle className="h-5 w-5 text-blue-500 fill-blue-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          index <= step
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stepItem.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-8 h-px bg-gray-300 mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Step */}
          <div className="mb-6">
            <StepComponent
              onNext={nextStep}
              onPrevious={prevStep}
              isFirstStep={step === 0}
              isLastStep={step === steps.length - 1}
              onSubmit={onSubmit}
            />
          </div>

          {/* Debug info (remove in production) */}
          <div className="text-xs text-muted-foreground">
            Application ID: {applicationId} | Property ID: {propertyId} | Step: {step + 1}/{steps.length}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}