"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { Button } from "@/components/ui/button";
import ApplicationSteps from "./application-steps";
import PersonalDetails from "./steps/personal-details";
import StudentDetails from "./steps/student-details";
import EmployeeDetails from "./steps/employee-details";
import ParentDetails from "./steps/parent-details";
import PreviousLandlordDetails from "./steps/previous-landlord";
import FinalDetails from "./steps/final-details";
import { z } from "zod";
import {
  personalFormSchema,
  studentFormSchema,
  employeeFormSchema,
  parentFormSchema,
  previousLandlordFormSchema,
  finalFormSchema,
} from "./schemas";

type FormData = {
  propertyId: string | null;
  inquiryId: string | null;
  applicationId: string | null;
  personal: z.infer<typeof personalFormSchema> | null;
  student: z.infer<typeof studentFormSchema> | null;
  employee: z.infer<typeof employeeFormSchema> | null;
  parent: z.infer<typeof parentFormSchema> | null;
  previousLandlord: z.infer<typeof previousLandlordFormSchema> | null;
  final: z.infer<typeof finalFormSchema> | null;
};

interface StepComponent {
  onNext: (data: any) => void;
  formData: FormData;
}

interface Step {
  title: string;
  component: React.ComponentType<StepComponent>;
}

export default function ApplicationPageContent() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const inquiryId = searchParams.get("inquiryId");
  const applicationId = searchParams.get("applicationId");
  const agentAxios = useAgentAxios();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    propertyId: propertyId,
    inquiryId: inquiryId,
    applicationId: applicationId,
    personal: null,
    student: null,
    employee: null,
    parent: null,
    previousLandlord: null,
    final: null,
  });

  const steps: Step[] = [
    { title: "Personal Details", component: PersonalDetails },
    ...(formData.personal?.status === "Student"
      ? [{ title: "Student Details", component: StudentDetails }]
      : formData.personal?.status === "Employee"
      ? [{ title: "Employee Details", component: EmployeeDetails }]
      : []),
    { title: "Parent Details", component: ParentDetails },
    { title: "Previous Landlord", component: PreviousLandlordDetails },
    { title: "Final Details", component: FinalDetails },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  useEffect(() => {
    // Reset current step if it's beyond the available steps
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps.length, currentStep]);

  const handleNext = (data: any) => {
    const newFormData = { ...formData, ...data };
    if (data.personal) {
      newFormData.personal = data.personal;
    }
    if (data.applicationId) {
      newFormData.applicationId = data.applicationId;
    }
    setFormData(newFormData);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Application Form</h1>
      <ApplicationSteps steps={steps} currentStep={currentStep} />
      <Card className="p-6">
        <CurrentStepComponent onNext={handleNext} formData={formData} />
        <div className="flex justify-between mt-6">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button className="ml-auto" type="submit" form="current-form">
              Submit Application
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}