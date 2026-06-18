"use client";

import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GuarantorStepProps } from "../types";
import { GuarantorFormData } from "../schemas";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function GuarantorDetails({
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  onSubmit,
  isSharedAccess,
}: GuarantorStepProps) {
  const form = useFormContext<GuarantorFormData>();
  const agentAxios = useAgentAxios();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    // Validate only relevant fields
    const isValid = await form.trigger([
      "guarantor_name",
      "occupation",
      "home_address",
      "work_address",
      "time_at_address",
      "previous_address",
      "home_phone",
      "work_phone",
      "mobile",
      "personal_email",
      "work_email",
      "bank_name",
      "branch_address",
      "fax",
    ]);

    if (!isValid) return;

    // For shared access, just move to next step without API call
    // The form will be submitted at the final step
    if (isSharedAccess) {
      onNext?.();
      return;
    }

    setIsSubmitting(true);
    try {
      const stepData = form.getValues();
      
      // Remove File objects as they can't be serialized in JSON
      const cleanedData = { ...stepData };
      if (cleanedData.proof_of_employment instanceof File) {
        delete cleanedData.proof_of_employment;
      }
      
      
      await agentAxios.post(
        `/forms/${applicationId}/guarantor/add-details/`,
        cleanedData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Move next
      onNext?.();
    } catch (error) {
      console.error("Error saving guarantor details:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error("Error response:", (error as any).response?.data);
      }
      form.setError("root", {
        type: "manual",
        message: "Failed to save guarantor details. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6">
      <FormField
        control={form.control}
        name="guarantor_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="occupation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Occupation</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="bank_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Your Bank Name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="home_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="work_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="time_at_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Time at Current Address</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., 2 years" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="previous_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Previous Address (Optional)</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="home_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home Phone</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="work_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work Phone</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="personal_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Personal Email</FormLabel>
            <FormControl>
              <Input type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="work_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Work Email</FormLabel>
            <FormControl>
              <Input type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branch_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank Branch Address</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* <FormField
        control={form.control}
        name="fax"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fax (Optional)</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      /> */}

      {form.formState.errors.root && (
        <div className="text-red-500 text-sm mt-2">
          {form.formState.errors.root.message}
        </div>
      )}

      <div className="flex justify-between mt-6">
        {!isFirstStep && (
          <Button type="button" variant="outline" onClick={onPrevious}>
            Back
          </Button>
        )}
        <Button
          type="button"
          onClick={isLastStep ? form.handleSubmit(onSubmit) : handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : isLastStep ? "Submit" : "Next"}
        </Button>
      </div>
    </form>
  );
}
